import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if the user is an owner of a house
    let { data: house } = await supabase.from('houses').select('*').eq('owner_id', user.id).maybeSingle()
    
    // Or if the user is a member of a house
    if (!house) {
      const { data: membership } = await supabase.from('house_members').select('house_id, status').eq('user_id', user.id).maybeSingle()
      if (membership && membership.status === 'accepted') {
        const { data: memberHouse } = await supabase.from('houses').select('*').eq('id', membership.house_id).maybeSingle()
        house = memberHouse
      } else if (membership && membership.status === 'pending') {
        return NextResponse.json({ status: 'pending_invite', house_id: membership.house_id })
      }
    }

    if (!house) {
      return NextResponse.json({ status: 'no_house' })
    }

    // Fetch related data
    const [rooms, members, items] = await Promise.all([
      supabase.from('house_rooms').select('*').eq('house_id', house.id),
      supabase.from('house_members').select('*, user:user_id(username, global_name, avatar_url, nickname_rp)').eq('house_id', house.id),
      supabase.from('house_items').select('*').eq('house_id', house.id)
    ])

    return NextResponse.json({
      status: 'has_house',
      house,
      rooms: rooms.data || [],
      members: members.data || [],
      items: items.data || []
    })

  } catch (err: any) {
    console.error('Error fetching house data:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
