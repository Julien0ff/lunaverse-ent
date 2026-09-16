import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createSupabaseServer()
        const { data, error } = await supabase
            .from('interviews')
            .select('*, inspector:inspector_id (username, avatar_url)')
            .eq('id', params.id)
            .single()

        if (error) throw error
        return NextResponse.json({ interview: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        
        // 1. Fetch old data to compare
        const { data: oldData } = await supabase.from('interviews').select('*').eq('id', params.id).single()
        if (!oldData) throw new Error('Interview not found')

        let questions_data = body.questions_data
        
        // If target_role is updated and we don't pass questions_data directly, regenerate them
        if (body.target_role && body.target_role !== oldData.target_role && !body.questions_data) {
            const { generateInterviewQuestions } = require('@/lib/interview-questions')
            const q = generateInterviewQuestions(body.target_role)
            questions_data = q.map((question: any) => ({
                ...question,
                note: null,
                response: ''
            }))
        }

        // Auto calculate global note if we have dossier_note and interview_note
        let global_note = body.global_note
        if (body.interview_note !== undefined && body.dossier_note !== undefined) {
            const oral = parseFloat(body.interview_note) || 0
            const dossier = parseFloat(body.dossier_note) || 0
            global_note = ((dossier + (oral * 2)) / 3).toFixed(2)
        }

        const updates = { ...body, global_note, ...(questions_data && { questions_data }) }
        
        const { data, error } = await supabase
            .from('interviews')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        // --- DISCORD INTEGRATION ---
        const { sendDiscordDM, setDiscordMemberNickname, addDiscordMemberRole } = require('@/lib/discord-api')

        // 1. DM for Convocation
        if (
            (updates.scheduled_at && updates.scheduled_at !== oldData.scheduled_at) ||
            (updates.vocal_channel_name && updates.vocal_channel_name !== oldData.vocal_channel_name)
        ) {
            const dateStr = data.scheduled_at ? new Date(data.scheduled_at).toLocaleString('fr-FR') : 'à définir'
            const chanStr = data.vocal_channel_name || 'à définir'
            await sendDiscordDM(data.candidate_id, {
                title: `📅 Convocation à un Entretien : ${data.target_role}`,
                description: `Votre candidature a été mise à jour.\n\n**Date :** ${dateStr}\n**Lieu :** Salon Vocal \`${chanStr}\``,
                color: 0x5865F2
            })
        }

        // 2. Acceptance Logic
        if (updates.status === 'accepted' && oldData.status !== 'accepted') {
            const newNick = `${data.target_role} | ${data.rp_firstname} ${data.rp_lastname}`
            await setDiscordMemberNickname(data.candidate_discord_id, newNick)
            
            // Try to add the role in Discord (and update profile in DB)
            const { data: dbRoles } = await supabase.from('roles').select('id, discord_role_id').ilike('name', `%${data.target_role}%`).limit(1)
            if (dbRoles && dbRoles.length > 0) {
                const targetRole = dbRoles[0]
                if (targetRole.discord_role_id) {
                    await addDiscordMemberRole(data.candidate_discord_id, targetRole.discord_role_id)
                }
                await supabase.from('user_roles').upsert({ user_id: data.candidate_id, role_id: targetRole.id })
            }
            // Update profile nickname
            await supabase.from('profiles').update({ nickname_rp: `${data.rp_firstname} ${data.rp_lastname}` }).eq('id', data.candidate_id)
            
            await sendDiscordDM(data.candidate_id, {
                title: `🎉 Félicitations !`,
                description: `Vous avez été **accepté** au poste de **${data.target_role}**.\nVos rôles vous ont été attribués. Bienvenue dans l'équipe !`,
                color: 0x57F287
            })
        } else if (updates.status === 'refused' && oldData.status !== 'refused') {
            await sendDiscordDM(data.candidate_id, {
                title: `❌ Candidature Refusée`,
                description: `Malheureusement, votre candidature pour le poste de **${data.target_role}** n'a pas été retenue pour cette session.`,
                color: 0xED4245
            })
        }

        return NextResponse.json({ interview: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createSupabaseServer()
        const { error } = await supabase
            .from('interviews')
            .delete()
            .eq('id', params.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
