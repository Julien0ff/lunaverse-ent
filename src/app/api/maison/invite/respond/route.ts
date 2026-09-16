import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { addMemberToDiscordChannel } from '@/lib/discord-api'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { houseId, accept } = await req.json()
    if (!houseId) return NextResponse.json({ error: 'Missing houseId' }, { status: 400 })

    if (accept) {
      // 1. Update DB
      const { error } = await supabase.from('house_members').update({ status: 'accepted' }).eq('house_id', houseId).eq('user_id', user.id)
      if (error) throw error

      // 2. Add to Discord Category
      const { data: house } = await supabase.from('houses').select('discord_category_id').eq('id', houseId).single()
      const { data: profile } = await supabase.from('profiles').select('discord_id').eq('id', user.id).single()
      
      if (house?.discord_category_id && profile?.discord_id) {
        await addMemberToDiscordChannel(house.discord_category_id, profile.discord_id)
      }
    } else {
      // Reject -> Delete from DB
      await supabase.from('house_members').delete().eq('house_id', houseId).eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error responding to invite:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
