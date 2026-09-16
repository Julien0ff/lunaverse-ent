import { NextResponse } from 'next/server'
import { getFirstGuildId } from '@/lib/discord-api'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const token = process.env.DISCORD_BOT_TOKEN
        if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 })
        
        const guildId = await getFirstGuildId(token)
        if (!guildId) return NextResponse.json({ error: 'No guild found' }, { status: 404 })

        const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: { Authorization: `Bot ${token}` }
        })
        
        if (!res.ok) throw new Error('Failed to fetch channels')
        const channels = await res.json()
        
        // Return only Voice (type 2) and Stage (type 13) channels
        const vocalChannels = channels.filter((c: any) => c.type === 2 || c.type === 13)
        return NextResponse.json({ channels: vocalChannels })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
