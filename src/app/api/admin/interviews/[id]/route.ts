import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createSupabaseServer()
        const { data, error } = await supabase
            .from('interviews')
            .select('*, inspector:inspector_id (username, avatar_url)')
            .eq('id', params.id)
            .single()

        if (error) throw error
        return NextResponse.json({ interview: data })
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
        
        let questions_data = body.questions_data
        
        // If target_role is updated and we don't pass questions_data directly, regenerate them
        if (body.target_role && !body.questions_data) {
            // Need to import generateQuestionsForRole at top of file
            const { generateInterviewQuestions } = require('@/lib/interview-questions')
            const q = generateInterviewQuestions(body.target_role)
            questions_data = q.map((question: any) => ({
                ...question,
                note: null,
                response: ''
            }))
        }

        // Auto calculate global note if we have dossier_note and interview_note
        let global_note = body.global_note
        if (body.interview_note !== undefined && body.dossier_note !== undefined) {
            const oral = parseFloat(body.interview_note) || 0
            const dossier = parseFloat(body.dossier_note) || 0
            global_note = ((dossier + (oral * 2)) / 3).toFixed(2)
        }

        const updates = { ...body, global_note, ...(questions_data && { questions_data }) }
        
        const { data, error } = await supabase
            .from('interviews')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ interview: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createSupabaseServer()
        const { error } = await supabase
            .from('interviews')
            .delete()
            .eq('id', params.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
