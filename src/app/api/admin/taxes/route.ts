import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'
import { EmbedBuilder } from 'discord.js'
import { sendDiscordDM } from '@/lib/discord-api'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: taxes, error } = await admin
      .from('taxes')
      .select('*, target:profiles(id, username, discord_id)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ taxes: taxes || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Safely look up a profile by either its UUID or its Discord snowflake ID.
// Using `.or()` with a UUID cast on a non-UUID string throws a Postgres error,
// so we must split the two cases manually.
async function findProfileById(admin: ReturnType<typeof createSupabaseAdmin>, id: string) {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (UUID_REGEX.test(id)) {
    const { data } = await admin.from('profiles').select('id, username, balance').eq('id', id).maybeSingle()
    return data
  }
  // Discord snowflake — match via discord_id column
  const { data } = await admin.from('profiles').select('id, username, balance').eq('discord_id', id).maybeSingle()
  return data
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { reason, amount, auto_deduct } = body
    // Support both a single target_id and an array of target_ids
    const rawIds: string[] = body.target_ids?.length
      ? body.target_ids
      : body.target_id
        ? [body.target_id]
        : []

    if (!rawIds.length || !amount || Number(amount) <= 0)
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })

    const results: { username: string }[] = []
    const errors: { id: string; error: string }[] = []

    for (const rawId of rawIds) {
      const targetUser = await findProfileById(admin, rawId.trim())
      if (!targetUser) {
        errors.push({ id: rawId, error: 'Utilisateur introuvable' })
        continue
      }

      // Record tax entry (Unpaid)
      try {
        const amt = Number(amount)
        if (auto_deduct) {
          // Immediately update user's balance
          const newBalance = Math.max(0, (targetUser.balance || 0) - amt)
          await admin.from('profiles').update({ balance: newBalance }).eq('id', targetUser.id)
        }

        const { error: taxError } = await admin.from('taxes').insert([{
          user_id: targetUser.id,
          reason,
          amount: amt,
          is_paid: !!auto_deduct,
          is_preleve: !!auto_deduct
        }])
        
        if (taxError) {
           errors.push({ id: rawId, error: taxError.message })
           continue
        }
      } catch (err: any) {
        errors.push({ id: rawId, error: err.message })
        continue
      }

      results.push({ username: targetUser.username })
      
      // Notify target user via Discord DM
      try {
        const embed = new EmbedBuilder()
          .setTitle(auto_deduct ? '💸 Taxe Prélevée' : '🧾 Nouvelle Taxe')
          .setColor(auto_deduct ? 0xED4245 : 0xFEE75C) // Error Red for deduction, Warning Yellow for unpaid
          .setDescription(`Une taxe de **${amount}€** a été émise à votre encontre.\n\n**Motif :** ${reason}\n\n${auto_deduct ? '_Le montant a été automatiquement déduit de votre solde._' : '_Merci de régler cette taxe à la banque dès que possible._'}`)
          .setTimestamp()

        await sendDiscordDM(targetUser.id, embed)
      } catch (dmErr) {
        console.error(`Failed to send tax DM to ${targetUser.id}:`, dmErr)
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return NextResponse.json({ error: errors[0].error }, { status: 404 })
    }

    return NextResponse.json({ success: true, applied: results.length, errors, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { error } = await admin.from('taxes').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

