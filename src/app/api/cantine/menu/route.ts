import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { updateCanteenMenuMessage } from '@/lib/discord-bot'

/**
 * GET /api/cantine/menu
 * Returns current active menus.
 * A menu is "active" if today's day_of_week matches and current time is between time_start and time_end.
 *
 * POST /api/cantine/menu  [Admin only]
 * Body: { day_of_week: 0-6, time_start: "HH:MM", time_end: "HH:MM", starter: string, main: string, dessert: string, note?: string }
 *
 * DELETE /api/cantine/menu?id=<uuid>  [Admin only]
 */

async function isAdmin(supabase: ReturnType<typeof createSupabaseServer>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id)
  return (data || []).some((ur: any) => ur.role?.name === 'admin')
}

export async function GET() {
  const supabase = createSupabaseServer()
  const adminClient = createSupabaseAdmin()

  // Get all menus from today onwards
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`

  const { data: menus, error } = await adminClient
    .from('canteen_menus')
    .select('*')
    .gte('menu_date', todayStr)
    .order('menu_date', { ascending: true })
    .order('time_start', { ascending: true })

  if (error) {
    if (error.code === '42P01') {
      // Table doesn't exist yet — just return empty
      return NextResponse.json({ menus: [], active: null })
    }
    throw error
  }

  const all = menus || []
  // Find the currently active menu (matches today's date + time window)
  const active = all.find((m: any) =>
    m.menu_date === todayStr &&
    currentTime >= m.time_start &&
    currentTime <= m.time_end
  ) || null

  return NextResponse.json({ menus: all, active })
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServer()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Admin requis' }, { status: 403 })
  }

  const body = await request.json()
  const { menu_date, time_start, time_end, starter, main, side, drink, dessert, note } = body

  if (!menu_date || !time_start || !time_end || !main) {
    return NextResponse.json(
      { error: 'Champs requis: menu_date, time_start, time_end, main' },
      { status: 400 }
    )
  }

  const adminClient = createSupabaseAdmin()
  // Generate day_of_week based on the date just to keep backwards compatibility if needed
  const dayOfWeek = new Date(menu_date).getDay()

  const { data, error } = await adminClient
    .from('canteen_menus')
    .insert([{ menu_date, day_of_week: dayOfWeek, time_start, time_end, starter, main, side, drink, dessert, note }])
    .select()
    .single()

  if (error) throw error
  
  // Trigger Discord sync manually
  try {
    await updateCanteenMenuMessage()
  } catch (err) {
    console.error('Failed to trigger Discord sync on POST', err)
  }

  return NextResponse.json({ success: true, menu: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServer()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Admin requis' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const adminClient = createSupabaseAdmin()
  const { error } = await adminClient.from('canteen_menus').delete().eq('id', id)
  if (error) throw error

  // Trigger Discord sync manually
  try {
    await updateCanteenMenuMessage()
  } catch (err) {
    console.error('Failed to trigger Discord sync on DELETE', err)
  }

  return NextResponse.json({ success: true })
}
