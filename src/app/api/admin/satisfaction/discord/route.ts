import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data: roles } = await supabase.from('user_roles').select('role:roles(name)').eq('user_id', user.id)
    const isAdmin = roles?.some((r: any) => r.role?.name?.toLowerCase() === 'admin')
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { channelId, customMessage } = await req.json()
    if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'Bot token not found' }, { status: 500 })

    const payload = {
      content: customMessage || "Aidez-nous à améliorer le serveur et l'ENT en répondant à notre questionnaire de satisfaction !",
      embeds: [
        {
          title: "📝 Questionnaire de Satisfaction",
          description: "Votre avis compte ! Prenez 2 minutes pour remplir le formulaire directement sur l'ENT.\n\n👉 **[Cliquez ici pour répondre au questionnaire](https://ent.lunaverse.fr/satisfaction)**",
          color: 0x5865F2,
          footer: { text: "LunaVerse ENT — Administration" }
        }
      ]
    }

    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Discord API error: ${err}`)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
