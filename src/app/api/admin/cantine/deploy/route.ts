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
    // 2. Fetch settings for discord channel
    const { data: settingsData } = await supabase
      .from('server_settings')
      .select('key, value')
      .in('key', ['discord_canteen_menu_channel_id', 'cantine_channel_id'])

    const menuChannelId = settingsData?.find(s => s.key === 'discord_canteen_menu_channel_id')?.value
    const rpChannelId = settingsData?.find(s => s.key === 'cantine_channel_id')?.value

    if (!menuChannelId) {
      return NextResponse.json({ error: 'Veuillez configurer le salon menu.' }, { status: 400 })
    }

    // 3. Fetch next 2 days from canteen_menus
    const today = new Date()
    today.setHours(0,0,0,0)
    const todayStr = today.toISOString().split('T')[0]

    const { data: menus } = await supabase
      .from('canteen_menus')
      .select('*')
      .gte('menu_date', todayStr)
      .order('menu_date', { ascending: true })
      .limit(2)

    if (!menus || menus.length === 0) {
      return NextResponse.json({ error: 'Aucun menu prévu pour aujourd\'hui ou demain.' }, { status: 400 })
    }

    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'DISCORD_BOT_TOKEN manquant.' }, { status: 500 })

    const embedFields = menus.map(m => {
      const date = new Date(m.menu_date)
      const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date)
      
      let val = ''
      if (m.starter) val += `**Entrée:** ${m.starter}\n`
      if (m.main) val += `**Plat:** ${m.main}\n`
      if (m.side) val += `**Accompagnement:** ${m.side}\n`
      if (m.drink) val += `**Boisson:** ${m.drink}\n`
      if (m.dessert) val += `**Dessert:** ${m.dessert}\n`
      if (m.note) val += `*${m.note}*\n`

      return {
        name: `📅 ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${date.toLocaleDateString('fr-FR')}`,
        value: val || 'Aucun menu défini.',
        inline: false
      }
    })

    // 4. Send embed to Discord
    const res = await fetch(`https://discord.com/api/v10/channels/${menuChannelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [{
          title: '🍲 Menu de la Cantine',
          description: "Voici le menu pour les deux prochains jours !",
          color: 0xEAB308, // amber-500
          fields: embedFields
        }],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1, // Primary
                label: "Voir le reste de la semaine",
                custom_id: "cantine_show_more"
              }
            ]
          }
        ]
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Discord deploy error:', errText)
      return NextResponse.json({ error: 'Erreur Discord pour le menu' }, { status: 500 })
    }

    // 5. Send Scanner embed to RP Cantine Channel if configured
    if (rpChannelId) {
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
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
