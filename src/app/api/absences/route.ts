import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: absences, error } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: absences })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reason, duration, attachments } = await req.json()
    if (!reason || !duration) {
      return NextResponse.json({ error: 'Motif et durée requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('absences')
      .insert({
        user_id: user.id,
        reason,
        duration,
        attachments,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
