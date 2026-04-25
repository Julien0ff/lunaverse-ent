import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { sendDiscordDM } from '@/lib/discord-api'

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin check
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
    
    if (!roles?.some((r: any) => r.role.name === 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 })

    const { data: absence, error } = await supabase
      .from('absences')
      .update({ status })
      .eq('id', id)
      .select('*, profile:profiles(discord_id)')
      .single()

    if (error) throw error

    // Notify user via Discord DM
    if (absence.profile?.discord_id) {
      try {
        const isAccepted = status === 'accepted'
        await sendDiscordDM(absence.user_id, {
          title: isAccepted ? '✅ Absence Validée' : '❌ Absence Refusée',
          color: isAccepted ? 0x57F287 : 0xED4245,
          description: `Votre demande d'absence pour **"${absence.reason}"** a été **${isAccepted ? 'validée' : 'refusée'}** par l'administration.`,
          timestamp: new Date().toISOString()
        })
      } catch (dmErr) {
        console.error('Failed to send absence DM:', dmErr)
      }
    }

    return NextResponse.json({ item: absence })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
