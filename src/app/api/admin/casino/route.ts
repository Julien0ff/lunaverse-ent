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
        const { data } = await admin.from('roles').select('*').order('name')
        return NextResponse.json({ roles: data || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST — create game, DELETE — remove game, PATCH — update game
export async function POST(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        if (!await requireAdmin(supabase, admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const body = await request.json()
        const { data, error } = await admin.from('casino_games').insert([body]).select().single()
        if (error) throw error
        return NextResponse.json({ game: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        if (!await requireAdmin(supabase, admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const id = new URL(request.url).searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
        await admin.from('casino_games').delete().eq('id', id)
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
