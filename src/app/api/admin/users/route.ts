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

        const { data: users } = await admin.from('profiles').select('*').order('created_at', { ascending: false })
        return NextResponse.json({ users: users || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PATCH: update any profile fields (pronote_id, health, food, water, sleep, alcohol, etc.)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const user = await requireAdmin(supabase, admin)
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { userId, ...updates } = await request.json()
        if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

        // Whitelist updatable fields
        const ALLOWED = ['pronote_id', 'health', 'hunger', 'thirst', 'fatigue', 'hygiene', 'alcohol', 'balance', 'first_connection']
        const payload: Record<string, any> = {}
        for (const key of ALLOWED) {
            if (key in updates) {
                const val = updates[key]
                // Clamp stat values 0-100
                if (['health', 'hunger', 'thirst', 'fatigue', 'hygiene', 'alcohol'].includes(key)) {
                    payload[key] = Math.max(0, Math.min(100, Number(val)))
                } else {
                    payload[key] = val ?? null
                }
            }
        }

        if (Object.keys(payload).length === 0)
            return NextResponse.json({ error: 'Aucun champ valide' }, { status: 400 })

        const { error } = await admin.from('profiles').update(payload).eq('id', userId)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
