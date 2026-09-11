import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

// Helper function to check admin
async function isAdmin(supabase: ReturnType<typeof createSupabaseServer>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id)
  return (data || []).some((ur: any) => ur.role?.name === 'admin')
}

// GET: Fetch effectifs data and settings
export async function GET() {
  try {
    const supabase = createSupabaseServer()
    if (!(await isAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data: settingsData, error } = await supabase
      .from('server_settings')
      .select('key, value')
      .in('key', ['effectifs_data', 'salon_effectifs', 'rp_options'])

    if (error) throw error

    const settings = (settingsData || []).reduce((acc: any, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    return NextResponse.json({ 
      effectifs: settings.effectifs_data || { classiques: [], personnel: [] },
      salon_effectifs: settings.salon_effectifs || '',
      options: settings.rp_options || [] // To use for specialites
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH: Save effectifs data and discord channel
export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseServer()
    if (!(await isAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const admin = createSupabaseAdmin()
    
    // Save effectifs data
    if (body.effectifs) {
      await admin.from('server_settings').upsert({ key: 'effectifs_data', value: body.effectifs })
    }
    
    // Save channel ID
    if (body.salon_effectifs !== undefined) {
      await admin.from('server_settings').upsert({ key: 'salon_effectifs', value: body.salon_effectifs })
    }
    
    // Save options data (specialites)
    if (body.options) {
      await admin.from('server_settings').upsert({ key: 'rp_options', value: body.options })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
