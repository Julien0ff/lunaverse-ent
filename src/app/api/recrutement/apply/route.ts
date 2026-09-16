import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Vous devez être connecté avec Discord pour postuler.' }, { status: 401 })
    }

    const admin = createSupabaseAdmin()
    const body = await req.json()
    const { rp_firstname, rp_lastname, target_role, matieres, motivation, cv_url, disponibilites } = body

    if (!target_role || !rp_firstname || !rp_lastname) {
      return NextResponse.json({ error: 'Informations manquantes.' }, { status: 400 })
    }

    // Build the questions_data array for the interview
    const questions_data = [
      {
        id: 'q_motivation',
        category: 'MOTIVATION',
        question: 'Lettre de motivation',
        response: motivation || 'Non fournie',
        isGraded: false
      },
      {
        id: 'q_dispo',
        category: 'DISPONIBILITÉS',
        question: 'Disponibilités du candidat',
        response: disponibilites || 'Non fournies',
        isGraded: false
      },
      {
        id: 'q_cv',
        category: 'RESSOURCES',
        question: 'CV ou Portfolio',
        response: cv_url ? `Lien: ${cv_url}` : 'Aucun fichier fourni',
        isGraded: false
      }
    ]

    if (target_role === 'Professeur' && matieres && matieres.length > 0) {
      questions_data.unshift({
        id: 'q_matiere',
        category: 'CHOIX',
        question: 'Matières souhaitées',
        response: matieres.join(', '),
        isGraded: false
      })
    }

    // Insert into interviews using admin client to bypass RLS if possible
    const { data: interview, error } = await admin
      .from('interviews')
      .insert({
        candidate_discord_id: user.user_metadata.provider_id || user.id, // Fallback
        rp_firstname,
        rp_lastname,
        target_role,
        status: 'pending', // Pending review
        questions_data
      })
      .select()
      .single()

    if (error) throw error

    // Send Discord Webhook
    if (process.env.DISCORD_RECRUTEMENT_WEBHOOK) {
      const embed = {
        title: `Nouvelle Candidature : ${target_role}`,
        description: `**Candidat**: ${rp_firstname} ${rp_lastname} (<@${user.user_metadata.provider_id || user.id}>)\n**Matière(s)**: ${matieres && matieres.length > 0 ? matieres.join(', ') : 'N/A'}\n**Disponibilités**: ${disponibilites}\n\n[🔍 Voir le Dossier dans l'ENT](https://lunaverse-ent.vercel.app/admin/entretiens/${interview.id})`,
        color: 5814783
      }
      
      try {
        await fetch(process.env.DISCORD_RECRUTEMENT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔔 Un nouveau dossier de recrutement a été déposé.`,
            embeds: [embed]
          })
        })
      } catch (webhookErr) {
        console.error('Failed to send discord webhook', webhookErr)
      }
    }

    return NextResponse.json({ success: true, interview })
  } catch (err: any) {
    console.error('[Apply Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
