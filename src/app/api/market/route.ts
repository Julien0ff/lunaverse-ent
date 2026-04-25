import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    
    const { data: listings, error } = await supabase
      .from('market_listings')
      .select('*, seller:profiles!seller_id(username, avatar_url, nickname_rp), item:shop_items(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: listings })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { item_id, price } = await req.json()
    if (!item_id || price === undefined) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    // Check if user owns the item (in a real app we'd have a user_items table, 
    // but here let's assume they can list anything for now or check purchases)
    
    const { data, error } = await supabase
      .from('market_listings')
      .insert({
        seller_id: user.id,
        item_id,
        price,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
