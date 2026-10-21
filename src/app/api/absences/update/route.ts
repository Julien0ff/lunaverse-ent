import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { sendDiscordDM } from '@/lib/discord-api'

const ALLOWED_ROLES = ['admin', 'staff', 'principal', 'aed']

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Role check: Admin, Staff, Principal, or AED
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
    
    const isAuthorized = roles?.some((r: any) => ALLOWED_ROLES.includes(r.role?.name?.toLowerCase()))
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, status, processed_by } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 })

    const admin = createSupabaseAdmin()
    const updateData: any = {
      status,
      processed_at: new Date().toISOString(),
      processed_by: processed_by || user.id
    }

    const { data: absence, error } = await admin
      .from('absences')
      .update(updateData)
      .eq('id', id)
      .select('*, profile:profiles!absences_user_id_fkey(discord_id, username, nickname_rp), reviewer:profiles!absences_processed_by_fkey(id, username, nickname_rp, avatar_url)')
      .single()

    if (error) throw error

    // Notify user via Discord DM
    if (absence.profile?.discord_id) {
      try {
        const isAccepted = status === 'accepted'
        const reviewerName = absence.reviewer?.nickname_rp || absence.reviewer?.username || "l'administration"
        await sendDiscordDM(absence.user_id, {
          title: isAccepted ? '✅ Absence Validée' : '❌ Absence Refusée',
          color: isAccepted ? 0x57F287 : 0xED4245,
          description: `Votre demande d'absence pour **"${absence.reason}"** a été **${isAccepted ? 'validée' : 'refusée'}** par **${reviewerName}**.`,
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

export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Role check: Admin, Staff, Principal, or AED
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)
    
    const isAuthorized = roles?.some((r: any) => ALLOWED_ROLES.includes(r.role?.name?.toLowerCase()))
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const admin = createSupabaseAdmin()
    const { error } = await admin
      .from('absences')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
