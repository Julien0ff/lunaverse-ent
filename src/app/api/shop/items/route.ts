import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Use admin to bypass RLS on shop_items
    const admin = createSupabaseAdmin()
    const { data: items, error } = await admin
      .from('shop_items')
      .select('*')
      .order('name')

    if (error) throw error
    return NextResponse.json({ items: items || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
