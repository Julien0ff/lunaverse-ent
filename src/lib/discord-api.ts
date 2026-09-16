import { createSupabaseServer } from './supabase-server'

/**
 * Sends a Direct Message to a user via the Discord REST API.
 * This ensures DMs work reliably even if the bot's Realtime listeners fail.
 */
export async function sendDiscordDM(userId: string, embedData: any) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return false

    const supabase = createSupabaseServer()
    const { data: profile } = await supabase.from('profiles').select('discord_id, notifications_enabled').eq('id', userId).maybeSingle()
    
    if (!profile?.discord_id || profile.notifications_enabled === false) {
      return false
    }

    // 1. Create DM channel
    const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recipient_id: profile.discord_id })
    })

    if (!channelRes.ok) return false
    const channel = await channelRes.json()
    if (!channel.id) return false

    // 2. Send Message
    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embedData]
      })
    })

    return msgRes.ok
  } catch (err) {
    console.error('Failed to send direct Discord DM API:', err)
    return false
  }
}

export async function getFirstGuildId(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${token}` }
    })
    if (!res.ok) return null
    const guilds = await res.json()
    return guilds[0]?.id || null
  } catch {
    return null
  }
}

export async function setDiscordMemberNickname(discordId: string, nickname: string) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return false
    const guildId = await getFirstGuildId(token)
    if (!guildId) return false

    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick: nickname })
    })
    return res.ok
  } catch (e) {
    console.error('Failed to set nickname', e)
    return false
  }
}

export async function addDiscordMemberRole(discordId: string, roleId: string) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return false
    const guildId = await getFirstGuildId(token)
    if (!guildId) return false

    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}/roles/${roleId}`, {
      method: 'PUT',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }
    })
    return res.ok
  } catch (e) {
    console.error('Failed to add role', e)
    return false
  }
}
