import { createSupabaseServer } from './supabase-server'

export async function sendDiscordDMByDiscordId(discordId: string, embedData: any) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return false

    const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: discordId })
    })

    if (!channelRes.ok) return false
    const channel = await channelRes.json()
    if (!channel.id) return false

    const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embedData] })
    })

    return msgRes.ok
  } catch (err) {
    console.error('Failed to send direct Discord DM API:', err)
    return false
  }
}

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

export async function createHouseDiscordChannels(ownerPseudo: string, ownerDiscordId: string) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return null
    const guildId = await getFirstGuildId(token)
    if (!guildId) return null

    // Create Category (Type 4)
    // Permission Overwrites:
    // 0 = Role (everyone has same ID as guild)
    // 1 = Member
    const categoryRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Maison de ${ownerPseudo}`,
        type: 4, 
        permission_overwrites: [
          {
            id: guildId, // @everyone
            type: 0,
            deny: "1024" // VIEW_CHANNEL
          },
          {
            id: ownerDiscordId,
            type: 1,
            allow: "1024" // VIEW_CHANNEL
          }
        ]
      })
    })
    if (!categoryRes.ok) throw new Error('Failed to create category')
    const category = await categoryRes.json()
    const categoryId = category.id

    // Create default Text Channel (Type 0)
    const textRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `🏠・salon`,
        type: 0,
        parent_id: categoryId
      })
    })
    const textChannel = await textRes.json()

    // Create default Voice Channel (Type 2)
    const voiceRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `🔊・vocal`,
        type: 2,
        parent_id: categoryId
      })
    })
    const voiceChannel = await voiceRes.json()

    return {
      categoryId,
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id
    }
  } catch (e) {
    console.error('Failed to create house channels', e)
    return null
  }
}

export async function addMemberToDiscordChannel(channelId: string, memberDiscordId: string) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return false

    // Put a permission overwrite for this member allowing VIEW_CHANNEL (1024)
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/permissions/${memberDiscordId}`, {
      method: 'PUT',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 1, // Member
        allow: "1024",
        deny: "0"
      })
    })
    return res.ok
  } catch (e) {
    console.error('Failed to add member to channel permissions', e)
    return false
  }
}

export async function deleteDiscordChannel(channelId: string) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return false
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bot ${token}` }
    })
    return res.ok
  } catch (e) {
    return false
  }
}
