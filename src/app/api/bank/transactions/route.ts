import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

    const { data: transactions, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .gte('created_at', fiveDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    const mapped = (transactions || []).map((tx: any) => {
      // Determine if money went OUT (from) or IN (to) relative to viewer
      const isOutgoing =
        tx.from_user_id === user.id ||
        tx.type === 'tax' ||
        tx.type === 'purchase'
      // Normalise so the amount is always unsigned in DB; apply sign here
      const signedAmount = isOutgoing ? -Math.abs(tx.amount) : Math.abs(tx.amount)
      return {
        ...tx,
        amount: signedAmount,
        created: tx.created_at,
      }
    })


    return NextResponse.json({ items: mapped, totalItems: count || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { action, amount, recipient } = body

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

    // ── TRANSFER ──────────────────────────────────────────────
    if (action === 'transfer') {
      if (!recipient || !amount)
        return NextResponse.json({ error: 'Destinataire et montant requis' }, { status: 400 })

      const transferAmount = Math.round(parseFloat(amount) * 100) / 100
      if (isNaN(transferAmount) || transferAmount <= 0)
        return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })

      const { data: recipientData } = await supabase
        .from('profiles').select('*')
        .or(`username.eq.${recipient},discord_id.eq.${recipient}`)
        .single()

      if (!recipientData) return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 })
      if (profile.id === recipientData.id) return NextResponse.json({ error: 'Impossible de vous transférer à vous-même' }, { status: 400 })
      if (profile.balance < transferAmount) return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

      const newSenderBalance = Math.round((profile.balance - transferAmount) * 100) / 100
      const newRecipientBalance = Math.round((recipientData.balance + transferAmount) * 100) / 100

      await supabase.from('profiles').update({ balance: newSenderBalance }).eq('id', profile.id)
      await supabase.from('profiles').update({ balance: newRecipientBalance }).eq('id', recipientData.id)
      await supabase.from('transactions').insert([{
        from_user_id: profile.id, to_user_id: recipientData.id,
        amount: transferAmount, type: 'transfer',
        description: `Transfert vers ${recipientData.username}`
      }])

      return NextResponse.json({ success: true, message: 'Transfert effectué !' })
    }

    // ── DAILY ─────────────────────────────────────────────────
    if (action === 'daily') {
      const lastDaily = profile.last_daily ? new Date(profile.last_daily) : null
      const now = new Date()
      const hoursSince = lastDaily ? (now.getTime() - lastDaily.getTime()) / 3600000 : 24

      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince)
        return NextResponse.json({ error: `Déjà récupéré. Revenez dans ${hoursLeft}h.` }, { status: 400 })
      }

      const dailyAmount = 50
      await supabase.from('profiles').update({
        balance: profile.balance + dailyAmount,
        last_daily: now.toISOString()
      }).eq('id', profile.id)

      await supabase.from('transactions').insert([{
        from_user_id: null, to_user_id: profile.id,
        amount: dailyAmount, type: 'daily',
        description: 'Récompense quotidienne'
      }])

      return NextResponse.json({ success: true, message: 'Récompense quotidienne récupérée !', amount: dailyAmount })
    }

    // ── SALARY ────────────────────────────────────────────────
    if (action === 'salary') {
      const { data: userRoles } = await supabase
        .from('user_roles').select('role:roles (*)').eq('user_id', profile.id)

      const now = new Date()
      const lastSalary = profile.last_salary ? new Date(profile.last_salary) : null
      const daysSince = lastSalary ? (now.getTime() - lastSalary.getTime()) / 86400000 : 8

      if (daysSince < 7)
        return NextResponse.json({ error: `Salaire déjà perçu. Revenez dans ${Math.ceil(7 - daysSince)} jour(s).` }, { status: 400 })

      let totalSalary = 0
      for (const ur of (userRoles || [])) {
        const role = (ur as any).role
        if (role) totalSalary += (role.salary_amount || 0) + (role.pocket_money || 0)
      }

      if (totalSalary > 0) {
        await supabase.from('profiles').update({
          balance: profile.balance + totalSalary, last_salary: now.toISOString()
        }).eq('id', profile.id)
        await supabase.from('transactions').insert([{
          from_user_id: null, to_user_id: profile.id,
          amount: totalSalary, type: 'salary', description: 'Salaire hebdomadaire'
        }])
        return NextResponse.json({ success: true, message: 'Salaire perçu !', amount: totalSalary })
      }

      return NextResponse.json({ error: 'Aucun salaire disponible.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
