import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// Stat effects per item category. Values are deltas applied to the profile.
// Column names match the Discord bot: hunger, thirst, fatigue, hygiene, alcohol, health
const ITEM_EFFECTS: Record<string, Partial<Record<'hunger' | 'thirst' | 'hygiene' | 'fatigue' | 'alcohol' | 'health', number>>> = {
  food:       { hunger: +25, health: +5 },
  drink:      { thirst: +20, alcohol: +2 },
  snack:      { hunger: +10 },
  drinks:     { thirst: +20, alcohol: +2 },
  snacks:     { hunger: +10 },
  beer:       { thirst: +5, alcohol: +20 },
  alcohol:    { alcohol: +30, health: -5 },
  clothing:   {},
  special:    {},
  luxury:     {},
  other:      {},
}

function clamp(val: number) { return Math.max(0, Math.min(100, val)) }

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { item_id, quantity = 1 } = await request.json()
    if (!item_id) return NextResponse.json({ error: 'item_id requis' }, { status: 400 })

    const { data: item } = await supabase.from('shop_items').select('*').eq('id', item_id).single()
    if (!item || !item.is_available) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

    const totalCost = item.price * quantity
    if (profile.balance < totalCost) return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

    // Compute survival stat changes
    const effects = ITEM_EFFECTS[item.category] || {}
    const statUpdates: Record<string, number> = {}
    for (const [stat, delta] of Object.entries(effects)) {
      const current = Number(profile[stat] ?? (stat === 'alcohol' ? 0 : 100))
      statUpdates[stat] = clamp(current + (delta as number) * quantity)
    }

    // Apply all updates atomically
    await supabase.from('profiles').update({
      balance: profile.balance - totalCost,
      ...statUpdates,
    }).eq('id', profile.id)

    try {
      await supabase.from('purchases').insert([{
        user_id: profile.id, item_id: item.id, quantity, total_price: totalCost
      }])
    } catch { }

    try {
      await supabase.from('transactions').insert([{
        from_user_id: profile.id, to_user_id: null,
        amount: -totalCost, type: 'purchase',
        description: `Achat: ${item.name} x${quantity}`
      }])
    } catch { }

    // Build human-readable effects summary
    const effectsSummary = Object.entries(statUpdates)
      .map(([k, v]) => {
        const prev = Number(profile[k] ?? (k === 'alcohol' ? 0 : 100))
        const diff = v - prev
        const label: Record<string, string> = {
          hunger: '🍔 Faim',
          thirst: '💧 Soif',
          alcohol: '🍺 Alcool',
          health: '❤️ Santé',
          fatigue: '😴 Fatigue',
          hygiene: '🧴 Hygiène',
        }
        return `${label[k] || k}: ${diff > 0 ? '+' : ''}${diff}`
      })
      .filter(Boolean)
      .join(' • ')

    return NextResponse.json({
      success: true,
      message: `Achat de ${item.name} réussi !`,
      effects: effectsSummary || null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
