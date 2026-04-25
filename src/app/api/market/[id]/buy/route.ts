import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = params

    // Transactional logic
    const { data: listing, error: lError } = await supabase
      .from('market_listings')
      .select('*, item:shop_items(*)')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (lError || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.seller_id === user.id) return NextResponse.json({ error: 'You cannot buy your own item' }, { status: 400 })

    const { data: buyer, error: bError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (bError || !buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    if (buyer.balance < listing.price) return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })

    // Perform purchase
    const { error: updateError } = await supabase.rpc('handle_market_purchase', {
      listing_id: id,
      buyer_user_id: user.id
    })

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
