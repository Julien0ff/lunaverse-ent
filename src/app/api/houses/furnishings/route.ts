import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// DLC Furnishings catalog with prices
const FURNISHINGS_CATALOG: Record<string, { name: string; price: number }> = {
  frigo: { name: 'Réfrigérateur', price: 500 },
  bed: { name: 'Lit King Size', price: 750 },
  tv: { name: 'Home Cinéma', price: 300 },
  safe: { name: 'Coffre Fort', price: 1000 },
}

export async function GET() {
  return NextResponse.json({ catalog: FURNISHINGS_CATALOG })
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { item_id } = await req.json()
    if (!item_id || !FURNISHINGS_CATALOG[item_id]) {
      return NextResponse.json({ error: 'Article inconnu' }, { status: 400 })
    }

    const catalogItem = FURNISHINGS_CATALOG[item_id]

    // 1. Get the user's house
    const { data: house, error: houseError } = await supabase
      .from('houses')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (houseError) throw houseError
    if (!house) return NextResponse.json({ error: 'Vous n\'avez pas de maison active.' }, { status: 400 })

    // 2. Check if already owned
    if (house.furnishings?.[item_id] === true) {
      return NextResponse.json({ error: 'Vous possédez déjà cet aménagement.' }, { status: 400 })
    }

    // 3. Check user balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, balance')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (Number(profile.balance) < catalogItem.price) {
      return NextResponse.json({ error: `Solde insuffisant. Il vous faut ${catalogItem.price}€ (solde actuel : ${Number(profile.balance).toFixed(2)}€).` }, { status: 400 })
    }

    // 4. Deduct balance
    const newBalance = Math.round((Number(profile.balance) - catalogItem.price) * 100) / 100
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id)

    if (balanceError) throw balanceError

    // 5. Update furnishings JSONB
    const newFurnishings = { ...(house.furnishings || {}), [item_id]: true }
    const { error: furnishError } = await supabase
      .from('houses')
      .update({ furnishings: newFurnishings })
      .eq('id', house.id)

    if (furnishError) throw furnishError

    // 6. Create transaction record
    await supabase.from('transactions').insert([{
      from_user_id: user.id,
      to_user_id: null,
      amount: catalogItem.price,
      type: 'purchase',
      description: `Aménagement maison : ${catalogItem.name}`
    }])

    return NextResponse.json({
      success: true,
      item: item_id,
      newBalance,
      furnishings: newFurnishings
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
