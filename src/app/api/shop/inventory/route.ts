import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('id, created_at, quantity, item:shop_items(id, name, price, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Group purchases by item id, handle array-style joins from Supabase
    const grouped = (purchases || []).reduce((acc: any, p: any) => {
      const item = Array.isArray(p.item) ? p.item[0] : p.item
      if (!item) return acc
      if (!acc[item.id]) {
        acc[item.id] = { ...item, quantity: 0, first_purchased: p.created_at }
      }
      acc[item.id].quantity += (p.quantity ?? 1)
      return acc
    }, {})

    return NextResponse.json({ items: Object.values(grouped) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
