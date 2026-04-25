import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
    
    const adminRoles = ['admin', 'staff', 'principal']
    const isAdmin = roles?.some((r: any) => adminRoles.includes(r.role?.name?.toLowerCase()))
    
    let query = supabase
      .from('absences')
      .select('*, profile:profiles(username, nickname_rp, avatar_url)')
    
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: absences, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: absences })
  } catch (err: any) {
    console.error('[API Absences] CRITICAL ERROR:', {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      stack: err.stack
    })
    return NextResponse.json({ 
      error: err.message, 
      code: err.code,
      details: err.details 
    }, { status: 500 })
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
