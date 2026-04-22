import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's already swiped profiles
    const { data: swipes } = await supabase
      .from('dating_swipes')
      .select('swiped_id')
      .eq('swiper_id', user.id)

    const swipedIds = (swipes || []).map((s: any) => s.swiped_id).filter(Boolean)
    swipedIds.push(user.id) // Exclude self

    // Try to fetch with dating-specific columns
    // If columns don't exist yet, fall back to basic profile fetch
    let profiles: any[] = []

    try {
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, discord_id, dating_photo_url, dating_bio, dating_photos')
        .or('dating_photo_url.not.is.null, dating_photos.neq.[]')
        .limit(15)

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
      }

      const { data, error } = await query
      if (error) throw error
      profiles = data || []
    } catch {
      // Fallback: dating columns may not exist yet — fetch all profiles without opt-in filter
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, discord_id')
        .limit(15)

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
      }

      const { data } = await query
      profiles = data || []
    }

    return NextResponse.json({ items: profiles })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

