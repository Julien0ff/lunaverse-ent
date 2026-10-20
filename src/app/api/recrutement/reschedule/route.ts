import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { sendDiscordDMByDiscordId } from '@/lib/discord-api'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Vous devez être connecté avec Discord.' }, { status: 401 })
    }

    const admin = createSupabaseAdmin()
    const discordId = user.user_metadata.provider_id || user.id

    // Fetch the candidate's active interview
    const { data: interview, error: fetchErr } = await admin
      .from('interviews')
      .select('*, inspector:profiles!inspector_id(id, discord_id, username, nickname_rp)')
      .eq('candidate_discord_id', discordId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchErr || !interview) {
      return NextResponse.json({ error: 'Aucun dossier d\'entretien trouvé pour votre compte.' }, { status: 404 })
    }

    if (['accepted', 'refused'].includes(interview.status)) {
      return NextResponse.json({ error: 'Cet entretien est déjà clôturé.' }, { status: 400 })
    }

    const body = await req.json()
    const { action, proposed_date, reason } = body

    const existingRequests: any[] = Array.isArray(interview.reschedule_requests)
      ? interview.reschedule_requests
      : []

    if (action === 'cancel') {
      const updatedRequests = existingRequests.map(r => 
        r.status === 'pending' ? { ...r, status: 'cancelled', cancelled_at: new Date().toISOString() } : r
      )

      const { data: updatedInterview, error: updateErr } = await admin
        .from('interviews')
        .update({
          reschedule_requests: updatedRequests,
          updated_at: new Date().toISOString()
        })
        .eq('id', interview.id)
        .select()
        .single()

      if (updateErr) throw updateErr
      return NextResponse.json({ success: true, interview: updatedInterview })
    }

    // Default: 'request'
    if (!proposed_date) {
      return NextResponse.json({ error: 'Veuillez sélectionner une date et une heure.' }, { status: 400 })
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Veuillez préciser le motif de votre indisponibilité.' }, { status: 400 })
    }

    const proposedDateObj = new Date(proposed_date)
    if (isNaN(proposedDateObj.getTime())) {
      return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
    }

    const newRequest = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      original_date: interview.scheduled_at,
      proposed_date: proposedDateObj.toISOString(),
      reason: reason.trim(),
      status: 'pending' // pending | accepted | refused
    }

    // Keep past requests and supersede any existing pending one
    const updatedRequests = [
      ...existingRequests.map(r => r.status === 'pending' ? { ...r, status: 'superseded' } : r),
      newRequest
    ]

    const { data: updatedInterview, error: updateErr } = await admin
      .from('interviews')
      .update({
        reschedule_requests: updatedRequests,
        updated_at: new Date().toISOString()
      })
      .eq('id', interview.id)
      .select()
      .single()

    if (updateErr) throw updateErr

    // --- NOTIFY STAFF ---
    const originalDateFormatted = interview.scheduled_at 
      ? new Date(interview.scheduled_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
      : 'Non définie'
    const proposedDateFormatted = proposedDateObj.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
    const candidateName = interview.rp_firstname && interview.rp_lastname 
      ? `${interview.rp_firstname} ${interview.rp_lastname}`
      : 'Candidat'

    const staffEmbed = {
      title: `🔄 Demande de report d'entretien : ${interview.target_role}`,
      description: `Le candidat **${candidateName}** (<@${interview.candidate_discord_id}>) n'est pas disponible pour son entretien.\n\n` +
        `📅 **Date initiale :** ${originalDateFormatted}\n` +
        `🕒 **Nouvelle date demandée :** ${proposedDateFormatted}\n` +
        `💬 **Motif d'indisponibilité :**\n> ${reason.trim()}\n\n` +
        `👉 Vous pouvez accepter ou refuser cette demande directement sur l'ENT.`,
      color: 0xFEE75C,
      footer: { text: 'LunaVerse ENT — Recrutement' },
      timestamp: new Date().toISOString()
    }

    const staffComponents = [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 2, // Button
            style: 5, // Link
            label: "Gérer la demande sur l'ENT",
            url: `https://ent.lunaverse.fr/admin/entretiens/${interview.id}`
          }
        ]
      }
    ]

    // 1. Send DM to the assigned inspector if available
    if (interview.inspector?.discord_id) {
      await sendDiscordDMByDiscordId(interview.inspector.discord_id, staffEmbed, staffComponents)
    }

    // 2. Also send DM to admins or fallback if inspector doesn't have DM
    // Fetch all admins to notify them
    try {
      const { data: adminRoles } = await admin
        .from('user_roles')
        .select('user_id, roles!inner(name)')
        .eq('roles.name', 'admin')

      if (adminRoles && adminRoles.length > 0) {
        const adminUserIds = adminRoles.map((r: any) => r.user_id).filter((uid: string) => uid !== interview.inspector_id)
        if (adminUserIds.length > 0) {
          const { data: adminProfiles } = await admin
            .from('profiles')
            .select('discord_id')
            .in('id', adminUserIds)

          for (const prof of (adminProfiles || [])) {
            if (prof.discord_id) {
              await sendDiscordDMByDiscordId(prof.discord_id, staffEmbed, staffComponents).catch(() => null)
            }
          }
        }
      }
    } catch (e) {
      console.error('Error notifying admins:', e)
    }

    // 3. Send Webhook notification if configured
    if (process.env.DISCORD_RECRUTEMENT_WEBHOOK) {
      try {
        await fetch(process.env.DISCORD_RECRUTEMENT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔔 **Demande de report d'entretien pour le poste de ${interview.target_role}**`,
            embeds: [staffEmbed],
            components: staffComponents
          })
        })
      } catch (err) {
        console.error('Failed to send webhook for reschedule:', err)
      }
    }

    return NextResponse.json({ success: true, interview: updatedInterview, request: newRequest })
  } catch (err: any) {
    console.error('[Reschedule Request Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
