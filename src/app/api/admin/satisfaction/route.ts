import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: forms, error } = await supabase
            .from('satisfaction_forms')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ forms })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { target_discord_id } = body

        if (!target_discord_id) {
            return NextResponse.json({ error: 'target_discord_id is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('satisfaction_forms')
            .insert({
                target_discord_id,
                status: 'draft'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ form: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
