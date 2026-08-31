import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createSupabaseServer()

  // 1. Check admin
  const { data: userRoles } = await supabase.from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

  const isAdmin = userRoles?.some(r => (r.roles as any)?.name === 'admin')
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const { data: inscription, error: fetchErr } = await supabase.from('inscriptions').select('*').eq('id', id).single()
    if (fetchErr || !inscription) throw new Error('Inscription introuvable')

    // 2. Fetch settings
    const { data: settingsData } = await supabase
      .from('server_settings')
      .select('key, value')
      .in('key', ['salon_reponses'])

    const settings = (settingsData || []).reduce((acc: any, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    const salonReponses = settings['salon_reponses']

    if (!salonReponses) {
      return NextResponse.json({ error: 'Veuillez configurer le salon de réponses avant de notifier.' }, { status: 400 })
    }

    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'DISCORD_BOT_TOKEN manquant.' }, { status: 500 })

    const targetUserId = inscription.discord_id

    // 3. Send embed to Discord
    const SUCCESS = 0x57F287

    const res = await fetch(`https://discord.com/api/v10/channels/${salonReponses}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `<@${targetUserId}>`,
        embeds: [{
          title: '🎉 Ton compte a été créé !',
          description: `<@${targetUserId}>, ton inscription a été validée par l'administration et tes accès ont été créés !\nBienvenue officiellement dans l'établissement !`,
          color: SUCCESS
        }]
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Discord notify error:', errText)
      return NextResponse.json({ error: 'Erreur Discord' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
