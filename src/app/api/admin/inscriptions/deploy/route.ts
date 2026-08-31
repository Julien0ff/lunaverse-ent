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
          title: '🎓 Inscription Académique | LunaVerse',
          description: "Bienvenue dans le processus d'inscription !\n\nPour rejoindre officiellement les rangs de l'établissement, veuillez remplir votre dossier d'inscription. Vous recevrez ensuite vos accès à l'Environnement Numérique de Travail (ENT).\n\n**Comment s'inscrire ?**\n1️⃣ Cliquez sur le bouton **Commencer l'inscription** ci-dessous.\n2️⃣ Remplissez le formulaire avec vos informations RP.\n3️⃣ Un membre de l'administration validera votre dossier.\n\n*Préparez-vous à entrer dans la cour des grands !*",
          color: 0x5865F2,
          thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/3135/3135810.png" },
          image: { url: "https://media.discordapp.net/attachments/1256708304198303865/1271813155106193498/LUNAVERSE_ENT_4.png?ex=66de48a8&is=66dcf728&hm=c23067eb0a01e5200259e217278385b0d0c3ebc92c90c791dd15d18eefc8fca3&=&format=webp&quality=lossless&width=1164&height=654" },
          footer: { text: "Administration LunaVerse" }
        }],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 3, // Success
                label: "Commencer l'inscription",
                emoji: { name: "📝" },
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
