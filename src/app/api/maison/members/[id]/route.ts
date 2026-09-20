import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// PATCH: Update member role
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role } = await req.json()
    if (!role || !['enfant', 'parent'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 })
    }

    // Check if the user is the owner of the house the member belongs to
    const { data: member } = await supabase.from('house_members').select('house_id').eq('id', params.id).maybeSingle()
    if (!member) return NextResponse.json({ error: 'Membre introuvable.' }, { status: 404 })

    const { data: house } = await supabase.from('houses').select('owner_id').eq('id', member.house_id).single()
    if (!house || house.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { error } = await supabase.from('house_members').update({ role }).eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error updating member role:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: Kick member
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if the user is the owner of the house the member belongs to
    const { data: member } = await supabase.from('house_members').select('house_id').eq('id', params.id).maybeSingle()
    if (!member) return NextResponse.json({ error: 'Membre introuvable.' }, { status: 404 })

    const { data: house } = await supabase.from('houses').select('owner_id').eq('id', member.house_id).single()
    if (!house || house.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { error } = await supabase.from('house_members').delete().eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error kicking member:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
