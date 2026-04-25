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
