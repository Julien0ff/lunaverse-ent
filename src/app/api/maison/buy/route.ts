import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { createHouseDiscordChannels } from '@/lib/discord-api'

const PRICES = {
  'Appartement': 5000,
  'Maison': 20000,
  'Villa': 50000
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { type } = await req.json()
    if (!['Appartement', 'Maison', 'Villa'].includes(type)) {
      return NextResponse.json({ error: 'Invalid house type' }, { status: 400 })
    }
    const price = PRICES[type as keyof typeof PRICES]

    // Check if user already has a house
    const { data: existingHouse } = await supabase.from('houses').select('id').eq('owner_id', user.id).maybeSingle()
    if (existingHouse) {
      return NextResponse.json({ error: 'Vous possédez déjà une maison.' }, { status: 400 })
    }

    // We use Admin to bypass RLS for fetching the profile and updating the wallet
    const admin = createSupabaseAdmin()

    // Get user balance and profile
    const { data: profile, error: profileError } = await admin.from('profiles').select('balance, discord_id, username, nickname_rp').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found: ' + (profileError?.message || 'No profile data') }, { status: 404 })

    if ((profile.balance || 0) < price) {
      return NextResponse.json({ error: 'Fonds insuffisants' }, { status: 400 })
    }

    // 1. Deduct money
    const newBalance = (profile.balance || 0) - price
    const { error: walletError } = await admin.from('profiles').update({ balance: newBalance }).eq('id', user.id)
    if (walletError) throw walletError

    // 2. Create Discord Channels
    const ownerPseudo = profile.nickname_rp || profile.username
    let discordCatId = null
    let channels = null
    
    if (profile.discord_id) {
       channels = await createHouseDiscordChannels(ownerPseudo, profile.discord_id)
       if (channels) {
         discordCatId = channels.categoryId
       }
    }

    // 3. Create House
    const { data: house, error: houseError } = await supabase.from('houses').insert({
      owner_id: user.id,
      house_type: type,
      sq_meters: type === 'Villa' ? 250 : type === 'Maison' ? 120 : 60,
      discord_category_id: discordCatId
    }).select().single()
    
    if (houseError) throw houseError

    // 4. Save default rooms if created
    if (channels) {
      await supabase.from('house_rooms').insert([
        { house_id: house.id, name: 'salon', type: 'text', discord_channel_id: channels.textChannelId },
        { house_id: house.id, name: 'vocal', type: 'voice', discord_channel_id: channels.voiceChannelId }
      ])
    }

    return NextResponse.json({ success: true, house })
  } catch (err: any) {
    console.error('Error buying house:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
