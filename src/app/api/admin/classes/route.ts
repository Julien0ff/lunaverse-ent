import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createSupabaseServer()
  const { data: userRoles } = await supabase.from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

  const isAdmin = userRoles?.some(r => (r.roles as any)?.name === 'admin')
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await supabase
    .from('server_settings')
    .select('value')
    .eq('key', 'rp_classes')
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ classes: data?.value || [] })
}

export async function POST(request: Request) {
  const supabase = createSupabaseServer()
  const { data: userRoles } = await supabase.from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

  const isAdmin = userRoles?.some(r => (r.roles as any)?.name === 'admin')
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { classes } = await request.json()
    if (!Array.isArray(classes)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const { error } = await supabase
      .from('server_settings')
      .upsert({ key: 'rp_classes', value: classes })

    if (error) throw error

    return NextResponse.json({ success: true, classes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
