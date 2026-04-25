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

    const { id, status, discord_channel_id, category_id } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 })

    const { data: house, error } = await supabase
      .from('houses')
      .update({
        status,
        discord_channel_id,
        category_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: house })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
