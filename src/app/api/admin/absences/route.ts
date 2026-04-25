import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin role
    const { data: roles } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id)
    const isAdmin = roles?.some((r: any) => r.roles.name === 'Admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: absences, error } = await supabase
      .from('absences')
      .select('*, profiles(username, avatar_url, nickname_rp)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: absences })
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
    const isAdmin = roles?.some((r: any) => r.roles.name === 'Admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 })

    const { data, error } = await supabase
      .from('absences')
      .update({
        status,
        processed_at: new Date().toISOString(),
        processed_by: user.id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
