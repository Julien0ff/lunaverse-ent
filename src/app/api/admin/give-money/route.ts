import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendDiscordDM } from '@/lib/discord-api'

export async function POST(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const user = await requireAdmin(supabase, admin)
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { username, amount, reason, auto_add } = await request.json()
        if (!username || !amount || isNaN(+amount)) {
            return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
        }

        // Find target user
        const { data: target } = await admin
            .from('profiles').select('*')
            .or(`username.eq.${username},discord_id.eq.${username}`)
            .maybeSingle()

        if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

        const amt = Math.abs(+amount)
        if (auto_add) {
            // Immediately add to user's balance
            const newBalance = (target.balance || 0) + amt
            await admin.from('profiles').update({ balance: newBalance }).eq('id', target.id)
        }

        // Record as a claimable reward or directly paid if auto_add
        const { error: rewardError } = await admin.from('taxes').insert([{
            user_id: target.id,
            amount: -amt,
            reason: reason || `Prime admin: ${amount}€`,
            is_paid: !!auto_add,
            is_preleve: !!auto_add
        }])
        if (rewardError) throw rewardError

        await sendDiscordDM(target.id, {
            title: '🎁 Prime Reçue',
            color: 0x57F287,
            description: auto_add 
              ? `Une prime de **${amount}€** a été ajoutée directement à votre solde.\n*Motif : ${reason || 'Aucun'}*`
              : `Une prime de **${amount}€** vous attend !\n*Motif : ${reason || 'Aucun'}*\n\nRendez-vous sur l'ENT pour la réclamer.`
        })

        return NextResponse.json({ 
            success: true, 
            message: auto_add 
              ? `Prime de ${amount}€ versée directement sur le solde de ${target.username}`
              : `Prime de ${amount}€ enregistrée pour ${target.username} (En attente de récupération)` 
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
