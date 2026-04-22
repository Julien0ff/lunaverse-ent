import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
    try {
        const supabase = createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        console.log(`[PROFILE] Upserting profile for user: ${user.id} (Discord ID: ${user.user_metadata?.provider_id || user.user_metadata?.sub || '?'})`)
        const admin = createSupabaseAdmin()
        const meta = user.user_metadata || {}

        const profileData = {
            id: user.id,
            discord_id: meta.provider_id || meta.sub || user.id,
            username:
                meta.custom_claims?.global_name ||
                meta.full_name ||
                meta.name ||
                meta.user_name ||
                meta.preferred_username ||
                'Joueur',
            avatar_url: meta.avatar_url || null,
        }

        const { data: upserted, error: upsertErr } = await admin
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
            .select()
            .single()

        if (!upsertErr && upserted) {
            return NextResponse.json({ profile: upserted })
        }

        console.warn('Upsert error:', upsertErr?.message)
        const { data: existing } = await admin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (existing) return NextResponse.json({ profile: existing })

        return NextResponse.json({ error: upsertErr?.message || 'Profile error' }, { status: 500 })
    } catch (err: any) {
        console.error('/api/auth/profile error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PATCH — update own profile fields (dating_bio, dating_photo_url)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

        const body = await request.json()
        const ALLOWED = ['dating_photo_url', 'dating_bio', 'dating_photos']
        const payload: Record<string, any> = {}
        for (const key of ALLOWED) {
            if (key in body) payload[key] = body[key] ?? null
        }
        if (Object.keys(payload).length === 0)
            return NextResponse.json({ error: 'Aucun champ valide' }, { status: 400 })

        const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
