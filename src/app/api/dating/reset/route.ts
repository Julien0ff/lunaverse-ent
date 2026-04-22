import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/dating/reset
 * Deletes all swipe records for the current user so they can
 * see previously-seen profiles again.
 */
export async function DELETE() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { error } = await supabase
      .from('dating_swipes')
      .delete()
      .eq('swiper_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Profils réinitialisés ! Vous verrez à nouveau tous les profils.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
