import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SUGGESTIONS_CHANNEL = '1505012112098066453'
const BUGS_CHANNEL = '1505012311277043863'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for discord info
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, nickname_rp, avatar_url')
      .eq('id', user.id)
      .single()

    const { type, title, description } = await req.json()

    if (!type || !title || !description) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) {
       return NextResponse.json({ error: 'Discord token not configured' }, { status: 500 })
    }

    const isSuggestion = type === 'suggestion'
    const channelId = isSuggestion ? SUGGESTIONS_CHANNEL : BUGS_CHANNEL
    const color = isSuggestion ? 0x57F287 : 0xED4245 // Success green for suggestions, Error red for bugs
    const embedTitle = isSuggestion ? `💡 Nouvelle Suggestion : ${title}` : `🐛 Rapport de Bug : ${title}`

    const embedData = {
      title: embedTitle,
      color: color,
      description: description,
      author: {
        name: profile?.nickname_rp || profile?.username || 'Utilisateur Anonyme',
        icon_url: profile?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'
      },
      timestamp: new Date().toISOString(),
      footer: { text: 'LunaVerse ENT — Feedback System' }
    }

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embedData]
      })
    })

    if (!response.ok) {
       console.error('Discord API Error:', await response.text())
       throw new Error('Failed to send to Discord')
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Error submitting feedback:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
