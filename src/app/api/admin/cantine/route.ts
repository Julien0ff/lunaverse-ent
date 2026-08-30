import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const user = await requireAdmin(supabase, admin)
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { data } = await admin
          .from('server_settings')
          .select('key, value')
          .in('key', ['cantine_start_time', 'cantine_end_time', 'canteen_menu_text'])

        const settings: Record<string, string> = {}
        if (data) {
          for (const row of data) {
            settings[row.key] = row.value
          }
        }

        return NextResponse.json(settings)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const user = await requireAdmin(supabase, admin)
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await request.json()
        const allowedKeys = ['cantine_start_time', 'cantine_end_time', 'canteen_menu_text']
        
        for (const [key, value] of Object.entries(body)) {
          if (allowedKeys.includes(key) && typeof value === 'string') {
            await admin
              .from('server_settings')
              .upsert({ key, value, updated_at: new Date().toISOString() })
          }
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
