import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { sendDiscordDMByDiscordId } from '@/lib/discord-api'

export const dynamic = 'force-dynamic'

async function getAdminStatus(supabase: any, userId: string) {
  const { data: roles } = await supabase.from('user_roles').select('role:roles(name)').eq('user_id', userId)
  return roles?.some((r: any) => ['admin', 'directeur'].includes(r.role?.name?.toLowerCase()))
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await getAdminStatus(supabase, user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const admin = createSupabaseAdmin()
    const { id } = params
    const body = await req.json()
    const { requestId, decision, refusal_reason, vocal_channel_name } = body

    if (!requestId || !['accept', 'refuse'].includes(decision)) {
      return NextResponse.json({ error: 'Paramètres manquants ou invalides.' }, { status: 400 })
    }

    const { data: interview, error: fetchErr } = await admin
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !interview) {
      return NextResponse.json({ error: 'Entretien introuvable.' }, { status: 404 })
    }

    const existingRequests: any[] = Array.isArray(interview.reschedule_requests)
      ? interview.reschedule_requests
      : []

    const targetReq = existingRequests.find((r: any) => r.id === requestId)
    if (!targetReq) {
      return NextResponse.json({ error: 'Demande de report introuvable.' }, { status: 404 })
    }

    let updatedScheduledAt = interview.scheduled_at
    const updatedVocalChannel = vocal_channel_name || interview.vocal_channel_name

    const updatedRequests = existingRequests.map((r: any) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: decision === 'accept' ? 'accepted' : 'refused',
          refusal_reason: decision === 'refuse' ? (refusal_reason?.trim() || null) : null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        }
      }
      return r
    })

    if (decision === 'accept') {
      updatedScheduledAt = targetReq.proposed_date
    }

    const { data: updatedInterview, error: updateErr } = await admin
      .from('interviews')
      .update({
        reschedule_requests: updatedRequests,
        scheduled_at: updatedScheduledAt,
        vocal_channel_name: updatedVocalChannel,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateErr) throw updateErr

    // --- NOTIFY CANDIDATE VIA DISCORD DM ---
    if (interview.candidate_discord_id) {
      const newDateFormatted = new Date(targetReq.proposed_date).toLocaleString('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short'
      })

      const components = [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 5, // Link
              label: decision === 'accept' ? 'Consulter ma convocation' : 'Proposer un autre créneau',
              url: 'https://ent.lunaverse.fr/recrutement'
            }
          ]
        }
      ]

      if (decision === 'accept') {
        await sendDiscordDMByDiscordId(interview.candidate_discord_id, {
          title: `✅ Demande de report acceptée : ${interview.target_role}`,
          description: `Votre demande de report a été **validée par l'administration** !\n\n` +
            `📅 **Nouvelle date d'entretien :** ${newDateFormatted}\n` +
            `🎙️ **Salon Vocal :** \`${updatedVocalChannel || 'À définir'}\`\n\n` +
            `Merci d'être présent(e) à l'heure convenue dans le salon vocal.`,
          color: 0x57F287,
          footer: { text: 'LunaVerse ENT — Recrutement' },
          timestamp: new Date().toISOString()
        }, components).catch(console.error)
      } else {
        const initialDateFormatted = interview.scheduled_at 
          ? new Date(interview.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
          : 'Non définie'

        await sendDiscordDMByDiscordId(interview.candidate_discord_id, {
          title: `❌ Demande de report refusée : ${interview.target_role}`,
          description: `Votre proposition de date (${newDateFormatted}) n'a pas pu être acceptée par le staff.\n\n` +
            (refusal_reason?.trim() ? `**Motif du refus :**\n> ${refusal_reason.trim()}\n\n` : '') +
            `📅 **Convocation initiale :** ${initialDateFormatted}\n\n` +
            `Si vous avez un empêchement majeur, vous pouvez formuler un autre créneau depuis l'ENT.`,
          color: 0xED4245,
          footer: { text: 'LunaVerse ENT — Recrutement' },
          timestamp: new Date().toISOString()
        }, components).catch(console.error)
      }
    }

    return NextResponse.json({ success: true, interview: updatedInterview })
  } catch (err: any) {
    console.error('[Admin Reschedule Decision Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
