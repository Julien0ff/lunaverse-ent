import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: taxes, error } = await supabase
      .from('taxes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ items: taxes || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { debtIds } = await req.json()
    
    if (!debtIds || !Array.isArray(debtIds) || debtIds.length === 0) {
      return NextResponse.json({ error: 'No debts selected' }, { status: 400 })
    }

    // Get the debts
    const { data: debts, error: debtsError } = await supabase
      .from('taxes')
      .select('id, amount, is_paid')
      .eq('user_id', user.id)
      .in('id', debtIds)

    if (debtsError || !debts) throw debtsError

    const unpaidDebts = debts.filter(d => !d.is_paid)
    if (unpaidDebts.length === 0) {
      return NextResponse.json({ success: true, message: 'Already paid' })
    }

    const totalToPay = unpaidDebts.reduce((sum, d) => sum + Number(d.amount), 0)

    // Check balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) throw profileError

    if (profile.balance < totalToPay) {
      return NextResponse.json({ error: `Fonds insuffisants. Il vous manque ${(totalToPay - profile.balance).toFixed(2)} €` }, { status: 400 })
    }

    // Process payment
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - totalToPay })
      .eq('id', user.id)

    if (updateError) throw updateError

    // Mark as paid
    await supabase
      .from('taxes')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .in('id', unpaidDebts.map(d => d.id))

    // Log transaction
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: -totalToPay,
      description: `Règlement d'impôts / amendes (${unpaidDebts.length} doc(s))`,
      type: 'tax'
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
