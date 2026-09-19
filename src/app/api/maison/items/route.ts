import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

const ITEM_PRICE = 100

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { item_id } = await req.json()
    if (!item_id) {
      return NextResponse.json({ error: 'Invalid item data' }, { status: 400 })
    }

    // Get House
    const { data: house } = await supabase.from('houses').select('id').eq('owner_id', user.id).single()
    if (!house) return NextResponse.json({ error: 'House not found' }, { status: 404 })

    const admin = createSupabaseAdmin()
    
    // Check balance
    const { data: profile } = await admin.from('profiles').select('balance').eq('id', user.id).single()
    if (!profile || (profile.balance || 0) < ITEM_PRICE) {
      return NextResponse.json({ error: 'Fonds insuffisants (100 € requis)' }, { status: 400 })
    }

    // Deduct money
    const newBalance = profile.balance - ITEM_PRICE
    await admin.from('profiles').update({ balance: newBalance }).eq('id', user.id)

    // Save Item
    const { error: insertError } = await supabase.from('house_items').insert({
      house_id: house.id,
      item_id
    })

    if (insertError) throw insertError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error buying house item:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
