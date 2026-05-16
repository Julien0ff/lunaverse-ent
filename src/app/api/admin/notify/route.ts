import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendDiscordDM } from '@/lib/discord-api'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { target_id, title, message, color, type } = await request.json()

    if (!target_id || !message) {
      return NextResponse.json({ error: 'target_id and message are required' }, { status: 400 })
    }

    // Find user to get discord_id
    const { data: targetProfile } = await admin
      .from('profiles')
      .select('discord_id, username')
      .or(`id.eq.${target_id},discord_id.eq.${target_id}`)
      .single()

    if (!targetProfile?.discord_id) {
      return NextResponse.json({ error: 'User not found or has no Discord ID linked' }, { status: 404 })
    }

    const embedColor = color || (type === 'error' ? 0xED4245 : type === 'success' ? 0x57F287 : 0x5865F2)

    await sendDiscordDM(targetProfile.discord_id, {
      embeds: [{
        title: title || 'Notification LunaVerse',
        description: message,
        color: embedColor,
        timestamp: new Date().toISOString(),
        footer: { text: 'LunaVerse ENT — Système de Notification' }
      }]
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
