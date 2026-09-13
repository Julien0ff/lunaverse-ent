import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { generateQuestionsForRole } from '@/lib/interview-questions'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if user is admin (simplified check, assumes middleware or RLS protects it)
        const { data: interviews, error } = await supabase
            .from('interviews')
            .select('*, inspector:inspector_id (username, avatar_url)')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ interviews })
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
        const { candidate_discord_id, rp_firstname, rp_lastname, target_role, scheduled_at } = body

        // Generate questions based on role
        const questions = generateQuestionsForRole(target_role)
        const questions_data = questions.map(q => ({
            ...q,
            note: null, // to be filled
            response: '' // optional
        }))

        const { data, error } = await supabase
            .from('interviews')
            .insert({
                candidate_discord_id,
                rp_firstname,
                rp_lastname,
                inspector_id: user.id, // Current admin
                target_role,
                scheduled_at: scheduled_at || null,
                questions_data: questions_data,
                status: 'draft'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ interview: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
