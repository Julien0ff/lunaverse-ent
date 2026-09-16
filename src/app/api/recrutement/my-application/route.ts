import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const discordId = user.user_metadata.provider_id || user.id

    const { data: application, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('candidate_discord_id', discordId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ application })
  } catch (err: any) {
    console.error('[MyApplication GET Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
