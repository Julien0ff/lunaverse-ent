import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/shop/inventory/discard
 * Body: { item_id: string, quantity?: number }
 * Removes `quantity` units of an item from the user's inventory (purchases table).
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { item_id, quantity = 1 } = await request.json()
    if (!item_id) return NextResponse.json({ error: 'item_id requis' }, { status: 400 })

    // Fetch user's inventory rows for this item
    const { data: rows, error: fetchError } = await supabase
      .from('purchases')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('item_id', item_id)
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'Objet non trouvé dans le sac' }, { status: 404 })

    const totalOwned = rows.reduce((acc: number, r: any) => acc + (r.quantity || 1), 0)
    if (quantity > totalOwned) return NextResponse.json({ error: `Vous ne possédez que ${totalOwned} exemplaire(s)` }, { status: 400 })

    // Remove oldest rows first until quantity removed
    let toRemove = quantity
    for (const row of rows) {
      if (toRemove <= 0) break
      const rowQty = row.quantity || 1
      if (rowQty <= toRemove) {
        await supabase.from('purchases').delete().eq('id', row.id)
        toRemove -= rowQty
      } else {
        await supabase.from('purchases').update({ quantity: rowQty - toRemove }).eq('id', row.id)
        toRemove = 0
      }
    }

    return NextResponse.json({ success: true, message: `${quantity} article(s) jeté(s)` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
