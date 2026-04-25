import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    
    const { data: topUsers, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, balance, nickname_rp')
      .order('balance', { ascending: false })
      .limit(10)

    if (error) throw error
    return NextResponse.json({ items: topUsers })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
