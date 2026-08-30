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

        const { data, error } = await admin
          .from('pronote_requests')
          .select(`
            id, image_url, status, created_at,
            profile:profiles ( id, username, discord_id, nickname_rp )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json(data)
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

        const { requestId, status, profileId, pronoteId } = await request.json()
        if (!requestId || !status) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

        // Update the request status
        const { error: reqError } = await admin
            .from('pronote_requests')
            .update({ status })
            .eq('id', requestId)

        if (reqError) throw reqError

        // If approved, set the pronote_id on the user's profile
        if (status === 'approved' && profileId && pronoteId) {
            const { error: profError } = await admin
                .from('profiles')
                .update({ pronote_id: pronoteId })
                .eq('id', profileId)

            if (profError) throw profError
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
