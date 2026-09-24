import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createSupabaseServer()

  // 1. Check admin
  const { data: userRoles } = await supabase.from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

  const isAdmin = userRoles?.some(r => (r.roles as any)?.name === 'admin')
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { data: settingsData } = await supabase
      .from('server_settings')
      .select('key, value')
      .in('key', ['cantine_channel_id'])

    const rpChannelId = settingsData?.find(s => s.key === 'cantine_channel_id')?.value

    if (!rpChannelId) {
      return NextResponse.json({ error: 'Veuillez configurer le salon RP.' }, { status: 400 })
    }

    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'DISCORD_BOT_TOKEN manquant.' }, { status: 500 })

    // Delete previous messages
    const getMsgsRes = await fetch(`https://discord.com/api/v10/channels/${rpChannelId}/messages?limit=20`, {
      headers: { 'Authorization': `Bot ${token}` }
    })
    if (getMsgsRes.ok) {
      const messages = await getMsgsRes.json()
      for (const msg of messages) {
        if (msg.embeds && msg.embeds.length > 0 && msg.embeds[0].title === '💳 Scanner son Abonnement') {
          await fetch(`https://discord.com/api/v10/channels/${rpChannelId}/messages/${msg.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bot ${token}` }
          }).catch(() => {})
        }
      }
    }

    // Send Scanner embed
    const rpRes = await fetch(`https://discord.com/api/v10/channels/${rpChannelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [{
          title: '💳 Scanner son Abonnement',
          description: "Cliquez ci-dessous pour badger à la cantine. L'accès sera déverrouillé automatiquement si vous êtes abonné et que c'est l'heure du repas.",
          color: 0x5865F2,
        }],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 3, // Success
                label: "Badger à la cantine",
                custom_id: "cantine_scan",
                emoji: { name: "🎫" }
              }
            ]
          }
        ]
      })
    })

    if (!rpRes.ok) {
      console.error('Discord scanner deploy error:', await rpRes.text())
      return NextResponse.json({ error: 'Erreur Discord pour le scanner' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
