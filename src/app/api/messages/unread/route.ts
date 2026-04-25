import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ count: 0 })

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false)

    if (error) throw error
    return NextResponse.json({ count: count || 0 })
  } catch (err: any) {
    console.error('[API Messages Unread] CRITICAL ERROR:', {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint
    })
    return NextResponse.json({ 
      error: err.message, 
      code: err.code,
      details: err.details 
    }, { status: 500 })
  }
}
