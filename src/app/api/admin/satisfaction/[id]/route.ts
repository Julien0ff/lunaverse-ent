import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createSupabaseServer()
        const { data, error } = await supabase
            .from('satisfaction_forms')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error) throw error

        let profile = null
        if (data.target_discord_id) {
            const { data: pData } = await supabase.from('profiles').select('discord_id, username, avatar_url, nickname_rp').eq('discord_id', data.target_discord_id).maybeSingle()
            profile = pData
        }

        return NextResponse.json({ form: { ...data, profile } })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        
        const { data, error } = await supabase
            .from('satisfaction_forms')
            .update(body)
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ form: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createSupabaseServer()
        const { error } = await supabase
            .from('satisfaction_forms')
            .delete()
            .eq('id', params.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
