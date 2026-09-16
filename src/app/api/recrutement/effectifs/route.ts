import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const admin = createSupabaseAdmin()

    // Fetch effectifs data (which contains slots for roles)
    const { data: settingsData, error } = await admin
      .from('server_settings')
      .select('key, value')
      .in('key', ['effectifs_data', 'rp_options'])

    if (error) throw error

    const settings = (settingsData || []).reduce((acc: any, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    return NextResponse.json({ 
      effectifs: settings.effectifs_data || { classiques: [], personnel: [] },
      options: settings.rp_options || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
