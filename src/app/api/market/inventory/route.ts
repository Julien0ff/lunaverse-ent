import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*, item:shop_items(*)')
      .eq('user_id', user.id)
      .gt('quantity', 0)

    if (error) throw error

    return NextResponse.json({ items: inventory })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
