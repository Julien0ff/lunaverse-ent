import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST: Mark first_connection as complete for the current user
export async function POST() {
    try {
        const supabase = createSupabaseServer()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { error } = await supabase
            .from('profiles')
            .update({ first_connection: false })
            .eq('id', user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
