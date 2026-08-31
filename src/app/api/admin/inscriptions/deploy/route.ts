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
    // 2. Fetch settings
    const { data: settingsData } = await supabase
      .from('server_settings')
      .select('key, value')
      .in('key', ['salon_admin', 'salon_reponses'])

    const settings = (settingsData || []).reduce((acc: any, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    const salonAdmin = settings['salon_admin']
    const salonReponses = settings['salon_reponses']

    if (!salonAdmin || !salonReponses) {
      return NextResponse.json({ error: 'Veuillez configurer les salons avant de déployer.' }, { status: 400 })
    }

    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'DISCORD_BOT_TOKEN manquant.' }, { status: 500 })

    // 3. Send embed to Discord
    const res = await fetch(`https://discord.com/api/v10/channels/${salonAdmin}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [{
          title: '🎓 Inscription à l\'Établissement',
          description: "Bienvenue ! Pour rejoindre les cours et accéder à l'ENT, veuillez remplir votre dossier d'inscription en cliquant sur le bouton ci-dessous.",
          color: 0x5865F2,
          image: { url: "https://media.discordapp.net/attachments/1256708304198303865/1271813155106193498/LUNAVERSE_ENT_4.png?ex=66de48a8&is=66dcf728&hm=c23067eb0a01e5200259e217278385b0d0c3ebc92c90c791dd15d18eefc8fca3&=&format=webp&quality=lossless&width=1164&height=654" } // example image or none
        }],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 3, // Success
                label: "📝 Commencer l'inscription",
                custom_id: `rp_enroll_start|${salonAdmin}|${salonReponses}`
              }
            ]
          }
        ]
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Discord deploy error:', errText)
      return NextResponse.json({ error: 'Erreur Discord' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
