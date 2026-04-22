import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { sourceId, reason, amount: manualAmount, source: manualSource } = await request.json()

    let finalAmount = manualAmount
    let finalSource = manualSource || 'Casino'

    if (sourceId) {
      const { data: sData, error: sError } = await supabase
        .from('dirty_money_sources')
        .select('*')
        .eq('id', sourceId)
        .eq('user_id', user.id)
        .single()
      
      if (sError || !sData) return NextResponse.json({ error: 'Source introuvable' }, { status: 404 })
      if (sData.declared) return NextResponse.json({ error: 'Déjà déclaré' }, { status: 400 })
      
      finalAmount = sData.amount
      finalSource = sData.source

      // Mark as declared
      await supabase.from('dirty_money_sources').update({ declared: true }).eq('id', sourceId)
    }

    if (!finalAmount || finalAmount <= 0 || !finalSource || !reason) {
      return NextResponse.json({ error: 'Paramètres manquants ou invalides' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('dirty_balance')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    if (profile.dirty_balance < finalAmount) return NextResponse.json({ error: 'Solde d\'argent sale insuffisant' }, { status: 400 })

    // Create declaration entry
    const { error: decError } = await supabase.from('declarations').insert([{
      user_id: user.id,
      amount: finalAmount,
      source: finalSource,
      reason,
      status: 'pending'
    }])

    if (decError) throw decError

    // Deduct from dirty balance (but don't add to main balance yet)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ dirty_balance: profile.dirty_balance - finalAmount })
      .eq('id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: 'Déclaration envoyée aux administrateurs' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
