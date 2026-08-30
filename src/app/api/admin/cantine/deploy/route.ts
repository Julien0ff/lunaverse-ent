import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const user = await requireAdmin(supabase, admin)
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { data } = await admin
          .from('server_settings')
          .select('key, value')
          .in('key', ['discord_canteen_menu_channel_id', 'discord_canteen_menu_message_id', 'canteen_menu_text'])

        const settings: Record<string, string> = {}
        if (data) {
          for (const row of data) {
            settings[row.key] = row.value
          }
        }

        const channelId = settings['discord_canteen_menu_channel_id']
        const menuText = settings['canteen_menu_text'] || '_Aucun menu défini._'
        const messageId = settings['discord_canteen_menu_message_id']

        if (!channelId) {
            return NextResponse.json({ error: 'Salon de cantine non configuré dans les paramètres.' }, { status: 400 })
        }

        const embed = {
            title: '🍽️ Menu de la Cantine',
            color: 0xF97316,
            description: menuText,
            timestamp: new Date().toISOString()
        }

        const components = [{
            type: 1,
            components: [{
                type: 2,
                custom_id: 'cantine_admin_refresh',
                label: 'Actualiser',
                style: 2,
                emoji: { name: '🔄' }
            }]
        }]

        const token = process.env.DISCORD_BOT_TOKEN
        if (!token) return NextResponse.json({ error: 'Discord Token manquant.' }, { status: 500 })

        const headers = {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
        }

        // Si messageId existe, on tente de l'éditer, sinon on en crée un nouveau
        if (messageId) {
            const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ embeds: [embed], components })
            })
            if (res.ok) {
                return NextResponse.json({ success: true })
            }
        }

        // Si pas de messageId ou erreur d'édition, on crée un nouveau message
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ embeds: [embed], components })
        })

        if (res.ok) {
            const msg = await res.json()
            await admin.from('server_settings').upsert({ key: 'discord_canteen_menu_message_id', value: msg.id, updated_at: new Date().toISOString() })
            return NextResponse.json({ success: true })
        } else {
            const err = await res.json()
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
