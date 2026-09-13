import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')

    if (!query) {
        return NextResponse.json({ members: [] })
    }

    if (!process.env.DISCORD_BOT_TOKEN) {
        return NextResponse.json({ error: 'DISCORD_BOT_TOKEN is missing' }, { status: 500 })
    }

    try {
        // 1. Get the bot's guilds (assuming it's only in one, or use the first one)
        const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        })
        if (!guildsRes.ok) throw new Error('Failed to fetch guilds')
        const guilds = await guildsRes.json()
        if (!guilds || guilds.length === 0) throw new Error('Bot is not in any guild')
        
        const guildId = guilds[0].id

        // 2. Search members in the guild
        const searchRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/search?query=${encodeURIComponent(query)}&limit=10`, {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        })
        if (!searchRes.ok) throw new Error('Failed to search members')
        
        const members = await searchRes.json()

        return NextResponse.json({ members })
    } catch (err: any) {
        console.error('[DISCORD MEMBERS SEARCH ERROR]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
