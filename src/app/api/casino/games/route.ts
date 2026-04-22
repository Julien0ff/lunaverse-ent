import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Use admin to bypass RLS on casino_games table
    const admin = createSupabaseAdmin()
    const { data: games, error } = await admin
      .from('casino_games')
      .select('*')
      .order('name')

    if (error) throw error
    return NextResponse.json({ games: games || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
