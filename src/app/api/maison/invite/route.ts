import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { targetUserId } = await req.json()
    if (!targetUserId) return NextResponse.json({ error: 'Missing target user ID' }, { status: 400 })

    // Check if user owns the house
    const { data: house } = await supabase.from('houses').select('id, type').eq('owner_id', user.id).single()
    if (!house) {
      return NextResponse.json({ error: 'Vous ne possédez aucune maison.' }, { status: 400 })
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
