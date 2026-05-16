import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin role
    const { data: roles } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id)
    const isAdmin = roles?.some((r: any) => r.roles?.name?.toLowerCase() === 'admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: houses, error } = await supabase
      .from('houses')
      .select('*, profiles(username, nickname_rp, avatar_url)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: houses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin role
    const { data: roles } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id)
    const isAdmin = roles?.some((r: any) => r.roles?.name?.toLowerCase() === 'admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, status, discord_channel_id, category_id, furnishings } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const updateData: any = { updated_at: new Date().toISOString() }
    if (status !== undefined) updateData.status = status
    if (discord_channel_id !== undefined) updateData.discord_channel_id = discord_channel_id
    if (category_id !== undefined) updateData.category_id = category_id
    if (furnishings !== undefined) updateData.furnishings = furnishings

    const { data: house, error } = await supabase
      .from('houses')
      .update(updateData)
      .eq('id', id)
      .select('*, profiles(discord_id)')
      .single()

    if (error) throw error

    if (status !== undefined) {
      await supabase.from('notifications').insert({
        user_id: house.owner_id,
        title: `Maison ${status === 'active' ? 'Validée' : 'Refusée'}`,
        message: `Votre demande pour la maison "${house.name}" a été ${status === 'active' ? 'acceptée' : 'refusée'}.`,
        type: status === 'active' ? 'success' : 'error',
        link: '/dashboard'
      })
    }

    return NextResponse.json({ item: house })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
