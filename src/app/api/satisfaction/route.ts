import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get user's discord profile
        const { data: profile } = await supabase.from('profiles').select('discord_id').eq('id', user.id).single()
        if (!profile || !profile.discord_id) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        // Find existing form
        let { data: form } = await supabase
            .from('satisfaction_forms')
            .select('*')
            .eq('target_discord_id', profile.discord_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!form) {
            // Create a new one
            const { data: newForm, error } = await supabase
                .from('satisfaction_forms')
                .insert({
                    target_discord_id: profile.discord_id,
                    status: 'draft'
                })
                .select()
                .single()
            
            if (error) throw error
            form = newForm
        }

        return NextResponse.json({ form })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        // Ensure user owns this form
        const { data: profile } = await supabase.from('profiles').select('discord_id').eq('id', user.id).single()
        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        const { data: existingForm } = await supabase
            .from('satisfaction_forms')
            .select('target_discord_id')
            .eq('id', id)
            .single()

        if (existingForm?.target_discord_id !== profile.discord_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { data, error } = await supabase
            .from('satisfaction_forms')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ form: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
