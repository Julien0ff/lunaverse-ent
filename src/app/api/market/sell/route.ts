import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { item_id, price, image_url } = await req.json()
    if (!item_id || !price) return NextResponse.json({ error: 'Item ID and price required' }, { status: 400 })

    const listingPrice = parseFloat(price)
    if (isNaN(listingPrice) || listingPrice <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

    // 1. Check Inventory
    const { data: invItem, error: invError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('item_id', item_id)
      .single()

    if (invError || !invItem || invItem.quantity <= 0) {
      return NextResponse.json({ error: 'Vous ne possédez pas cet objet.' }, { status: 400 })
    }

    // 2. Calculate Listing Fee (Exponential / Progressive)
    // Formula: 5% of price + (price^1.1 / 200)
    const listingFee = Math.round((listingPrice * 0.05 + Math.pow(listingPrice, 1.1) / 200) * 100) / 100

    // 3. Check Balance
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
    if (!profile || profile.balance < listingFee) {
      return NextResponse.json({ error: `Solde insuffisant pour payer la taxe de mise en vente (${listingFee}€).` }, { status: 400 })
    }

    // 4. Atomic updates (ideal with RPC but doing here for simplicity)
    // Deduct balance
    await supabase.from('profiles').update({ balance: profile.balance - listingFee }).eq('id', user.id)
    
    // Decrement inventory
    if (invItem.quantity === 1) {
      await supabase.from('inventory').delete().eq('user_id', user.id).eq('item_id', item_id)
    } else {
      await supabase.from('inventory').update({ quantity: invItem.quantity - 1 }).eq('user_id', user.id).eq('item_id', item_id)
    }

    // 5. Create Listing
    const { data: listing, error: listError } = await supabase
      .from('market_listings')
      .insert([{
        seller_id: user.id,
        item_id,
        price: listingPrice,
        image_url,
        listing_fee: listingFee,
        status: 'active'
      }])
      .select()
      .single()

    if (listError) throw listError

    // 6. Record transaction for fee
    await supabase.from('transactions').insert([{
      from_user_id: user.id,
      to_user_id: null, // Bank / System
      amount: listingFee,
      type: 'market_fee',
      description: `Taxe de mise en vente pour l'objet #${listing.id}`
    }])

    return NextResponse.json({ success: true, listing })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
