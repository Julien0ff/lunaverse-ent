import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: house, error } = await supabase
      .from('houses')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ house })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// House type base prices
const HOUSE_TYPE_PRICES: Record<string, number> = {
  appartement: 2000,
  maison: 5000,
  villa: 12000,
  manoir: 25000,
}

// Price per square meter
const PRICE_PER_SQM = 50

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, house_type, square_meters } = await req.json()
    if (!name) return NextResponse.json({ error: 'Nom de maison requis' }, { status: 400 })
    if (!house_type || !HOUSE_TYPE_PRICES[house_type]) return NextResponse.json({ error: 'Type de maison invalide' }, { status: 400 })
    if (!square_meters || square_meters < 20 || square_meters > 500) return NextResponse.json({ error: 'Surface invalide (20-500 m²)' }, { status: 400 })

    // Check if already has a house or pending request
    const { data: existing } = await supabase.from('houses').select('id').eq('owner_id', user.id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Vous avez déjà une maison ou une demande en cours' }, { status: 400 })

    // Calculate total price
    const basePrice = HOUSE_TYPE_PRICES[house_type]
    const sqmPrice = square_meters * PRICE_PER_SQM
    const totalPrice = basePrice + sqmPrice

    // Check user balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, balance')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError
    if (Number(profile.balance) < totalPrice) {
      return NextResponse.json({ error: `Solde insuffisant. Il vous faut ${totalPrice.toLocaleString()}€ (solde actuel : ${Number(profile.balance).toFixed(2)}€).` }, { status: 400 })
    }

    // Deduct balance
    const newBalance = Math.round((Number(profile.balance) - totalPrice) * 100) / 100
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id)

    if (balanceError) throw balanceError

    // Create house request
    const { data: house, error } = await supabase
      .from('houses')
      .insert([{ 
        owner_id: user.id, 
        name, 
        status: 'pending',
        house_type,
        square_meters,
        purchase_price: totalPrice
      }])
      .select()
      .single()

    if (error) throw error

    // Create transaction record
    await supabase.from('transactions').insert([{
      from_user_id: user.id,
      to_user_id: null,
      amount: totalPrice,
      type: 'purchase',
      description: `Achat maison : ${name} (${house_type}, ${square_meters}m²)`
    }])

    return NextResponse.json({ success: true, house, totalPrice, newBalance })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updates = await req.json()
    const { whitelist, blacklist } = updates

    const updateData: any = {}
    if (whitelist !== undefined) updateData.whitelist = whitelist
    if (blacklist !== undefined) updateData.blacklist = blacklist

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
    }

    const { data: house, error } = await supabase
      .from('houses')
      .update(updateData)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, house })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
