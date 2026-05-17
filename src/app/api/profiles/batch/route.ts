import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ids } = await req.json()
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ profiles: [] })
    }

    // Limit to 50 IDs to prevent abuse
    const limitedIds = ids.slice(0, 50)

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, nickname_rp, avatar_url')
      .in('id', limitedIds)

    if (error) throw error
    return NextResponse.json({ profiles: profiles || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
