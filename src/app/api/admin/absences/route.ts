import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin role
    const { data: roles } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id)
    const isAdmin = roles?.some((r: any) => r.roles?.name?.toLowerCase() === 'admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: absences, error } = await supabase
      .from('absences')
      .select('*, profiles(username, avatar_url, nickname_rp)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: absences })
  } catch (err: any) {
    console.error('[API Admin Absences] Error:', err)
    return NextResponse.json({ error: err.message, details: err }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin role
    const { data: roles } = await supabase.from('user_roles').select('roles(name)').eq('user_id', user.id)
    const isAdmin = roles?.some((r: any) => r.roles?.name?.toLowerCase() === 'admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 })

    const { data, error } = await supabase
      .from('absences')
      .update({
        status,
        processed_at: new Date().toISOString(),
        processed_by: user.id
      })
      .eq('id', id)
      .select('*, profiles(discord_id, username)')
      .single()

    if (error) throw error

    // Send Discord Notification
    if (data.profiles?.discord_id) {
      try {
        const { sendDiscordDM } = await import('@/lib/discord-api')
        const statusFr = status === 'accepted' ? 'VALIDÉE ✅' : 'REFUSÉE ❌'
        const color = status === 'accepted' ? 0x57F287 : 0xED4245
        
        await sendDiscordDM(data.user_id, {
          embeds: [{
            title: `Mise à jour d'absence - LunaVerse`,
            description: `Votre demande d'absence pour **${data.duration}** a été **${statusFr}**.`,
            fields: [
              { name: 'Motif', value: data.reason },
              { name: 'Statut', value: statusFr }
            ],
            color: color,
            timestamp: new Date().toISOString(),
            footer: { text: 'LunaVerse ENT — Système d\'Absences' }
          }]
        })
      } catch (dmError) {
        console.error('Error sending Discord DM:', dmError)
      }
    }

    return NextResponse.json({ item: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
