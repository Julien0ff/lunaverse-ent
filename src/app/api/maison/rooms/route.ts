import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { createHouseDiscordRoom } from '@/lib/discord-api'

const ROOM_PRICE = 500

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, type } = await req.json()
    if (!name || !['text', 'voice'].includes(type)) {
      return NextResponse.json({ error: 'Invalid room data' }, { status: 400 })
    }

    // Get House
    const { data: house } = await supabase.from('houses').select('id, house_type, discord_category_id').eq('owner_id', user.id).single()
    if (!house) return NextResponse.json({ error: 'House not found' }, { status: 404 })

    // Check Max Rooms
    const { count } = await supabase.from('house_rooms').select('id', { count: 'exact' }).eq('house_id', house.id)
    const maxRooms = house.house_type === 'Villa' ? 40 : house.house_type === 'Maison' ? 20 : 10
    if ((count || 0) >= maxRooms) {
      return NextResponse.json({ error: 'Limite de pièces atteinte' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    
    // Check balance
    const { data: profile } = await admin.from('profiles').select('balance').eq('id', user.id).single()
    if (!profile || (profile.balance || 0) < ROOM_PRICE) {
      return NextResponse.json({ error: 'Fonds insuffisants (500 € requis)' }, { status: 400 })
    }

    // Deduct money
    const newBalance = profile.balance - ROOM_PRICE
    await admin.from('profiles').update({ balance: newBalance }).eq('id', user.id)

    // Create Discord Channel
    let discord_channel_id = null
    if (house.discord_category_id) {
      discord_channel_id = await createHouseDiscordRoom(house.discord_category_id, name, type as 'text' | 'voice')
    }

    // Save Room
    const { error: insertError } = await supabase.from('house_rooms').insert({
      house_id: house.id,
      name,
      type,
      discord_channel_id
    })

    if (insertError) throw insertError

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error creating room:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
