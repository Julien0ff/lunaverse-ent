import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { type } = await req.json()
    
    if (type !== 'weekly' && type !== 'monthly') {
      return NextResponse.json({ error: 'Type d\'abonnement invalide' }, { status: 400 })
    }

    const price = type === 'weekly' ? 45 : 140
    const durationDays = type === 'weekly' ? 7 : 30

    // Fetch user profile to check balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, canteen_subscription')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.balance < price) {
      return NextResponse.json({ error: `Fonds insuffisants. Il vous manque ${(price - profile.balance).toFixed(2)} €` }, { status: 400 })
    }

    // Determine new date
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    // Run transaction safely
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        balance: profile.balance - price,
        canteen_subscription: type,
        canteen_subscription_end: endDate.toISOString()
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    // Add explicit transaction record
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: -price,
      description: `Achat Pass Cantine (${type === 'weekly' ? 'Hebdomadaire' : 'Mensuel'})`,
      type: 'purchase'
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
