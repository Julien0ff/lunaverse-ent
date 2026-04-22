import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const [postsResult, purchasesResult, casinoResult, profileResult] = await Promise.allSettled([
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('casino_history').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('partner_id, couple_since').eq('id', user.id).single()
    ])

    const postsCount = postsResult.status === 'fulfilled' ? (postsResult.value.count || 0) : 0
    const purchasesCount = purchasesResult.status === 'fulfilled' ? (purchasesResult.value.count || 0) : 0
    const casinoData = casinoResult.status === 'fulfilled' ? (casinoResult.value.data || []) : []

    const casinoStats = casinoData.reduce((acc: any, game: any) => {
      if (game.is_win) { acc.wins++; acc.totalWon += Number(game.win_amount || 0) }
      else { acc.totalLost += Number(game.bet_amount || 0) }
      return acc
    }, { wins: 0, totalWon: 0, totalLost: 0 })

    const profileData = profileResult.status === 'fulfilled' ? profileResult.value.data : null

    let partnerName = null
    if (profileData?.partner_id) {
      const { data: partnerProfile } = await supabase.from('profiles').select('username').eq('id', profileData.partner_id).single()
      if (partnerProfile) partnerName = partnerProfile.username
    }

    return NextResponse.json({
      posts: postsCount,
      purchases: purchasesCount,
      casinoWins: casinoStats.wins,
      totalWon: casinoStats.totalWon,
      totalLost: casinoStats.totalLost,
      likesReceived: 0,
      partnerName,
      coupleSince: profileData?.couple_since || null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
