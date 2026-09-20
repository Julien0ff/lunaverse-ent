import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { targetDiscordId } = await req.json()
    if (!targetDiscordId) return NextResponse.json({ error: 'Missing target Discord ID' }, { status: 400 })

    // Look up user profile by discord_id
    const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', targetDiscordId).maybeSingle()
    if (!profile) {
      return NextResponse.json({ error: 'Cet utilisateur n\'a pas de compte sur l\'ENT.' }, { status: 400 })
    }

    const targetUserId = profile.id

    // Check if user owns the house
    const { data: house, error: houseErr } = await supabase.from('houses').select('id, type').eq('owner_id', user.id).limit(1).maybeSingle()
    if (houseErr) {
      console.error('House query error:', houseErr)
    }
    if (!house) {
      return NextResponse.json({ error: 'Vous ne possédez aucune maison. (Ou erreur technique)' }, { status: 400 })
    }

    // Check if target user already belongs to a house
    const { data: existingMember } = await supabase.from('house_members').select('id').eq('user_id', targetUserId).maybeSingle()
    if (existingMember) {
      return NextResponse.json({ error: 'Cet utilisateur est déjà dans une maison ou a une invitation.' }, { status: 400 })
    }

    // Insert pending invitation
    const { error: inviteError } = await supabase.from('house_members').insert({
      house_id: house.id,
      user_id: targetUserId,
      role: 'enfant',
      status: 'pending'
    })

    if (inviteError) {
      if (inviteError.code === '23505') {
        return NextResponse.json({ error: 'Cet utilisateur a déjà été invité.' }, { status: 400 })
      }
      throw inviteError
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error inviting member:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
