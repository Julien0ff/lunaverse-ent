import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()

    // Online Users (from profiles where discord_status is not 'offline')
    const { data: onlineUsers } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, discord_status, nickname_rp')
      .neq('discord_status', 'offline')
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
