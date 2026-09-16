import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { deleteDiscordChannel } from '@/lib/discord-api'

const PRICES = {
  'Appartement': 5000,
  'Maison': 20000,
  'Villa': 50000
}

export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user owns the house
    const { data: house } = await supabase.from('houses').select('*').eq('owner_id', user.id).single()
    if (!house) {
      return NextResponse.json({ error: 'Vous ne possédez aucune maison.' }, { status: 400 })
    }

    const price = PRICES[house.type as keyof typeof PRICES] || 0
    const refund = Math.floor(price * 0.5) // 50% refund

    // Refund wallet
    const { data: profile } = await supabase.from('profiles').select('wallet').eq('id', user.id).single()
    if (profile) {
      await supabase.from('profiles').update({ wallet: (profile.wallet || 0) + refund }).eq('id', user.id)
    }

    // Delete Discord Category
    if (house.discord_category_id) {
      // Deleting category does not auto-delete child channels in API unless specified, but for simplicity we'll try to delete the category
      // Best practice is to delete the channels first
      const { data: rooms } = await supabase.from('house_rooms').select('discord_channel_id').eq('house_id', house.id)
      if (rooms) {
        for (const r of rooms) {
          if (r.discord_channel_id) await deleteDiscordChannel(r.discord_channel_id)
        }
      }
      await deleteDiscordChannel(house.discord_category_id)
    }

    // Delete House (Cascades to rooms, items, members)
    const { error: houseError } = await supabase.from('houses').delete().eq('id', house.id)
    if (houseError) throw houseError

    return NextResponse.json({ success: true, refund })
  } catch (err: any) {
    console.error('Error selling house:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
