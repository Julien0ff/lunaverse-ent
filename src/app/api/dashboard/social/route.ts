import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()

    // Online Users (Active on site in the last 15 minutes)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { data: onlineUsers } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, discord_status, nickname_rp')
      .gt('last_seen_at', fifteenMinsAgo)
      .limit(10)

    // Top Users for Dashboard Leaderboard
    const { data: leaderboard } = await supabase
      .from('profiles')
      .select('id, username, balance, avatar_url, nickname_rp')
      .order('balance', { ascending: false })
      .limit(5)

    return NextResponse.json({ 
      onlineUsers: onlineUsers || [],
      leaderboard: leaderboard || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
