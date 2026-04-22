import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/bank/search-users?q=<query>
 * Returns matching users for the bank transfer autocomplete.
 */
export async function GET(request: NextRequest) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ users: [] })

  const url = new URL(request.url)
  const q = url.searchParams.get('q') || ''

  if (q.length < 2) return NextResponse.json({ users: [] })

  const admin = createSupabaseAdmin()
  const { data: users } = await admin
    .from('profiles')
    .select('id, username, avatar_url, discord_id')
    .or(`username.ilike.%${q}%,discord_id.ilike.%${q}%`)
    .neq('id', user.id) // exclude self
    .limit(8)

  return NextResponse.json({ users: users || [] })
}
