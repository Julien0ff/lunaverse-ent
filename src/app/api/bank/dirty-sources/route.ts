import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: sources, error } = await supabase
      .from('dirty_money_sources')
      .select('*')
      .eq('user_id', user.id)
      .eq('declared', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sources })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
