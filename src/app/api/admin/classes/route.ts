import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createSupabaseServer()
  const { data: userRoles } = await supabase.from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

  const isAdmin = userRoles?.some(r => (r.roles as any)?.name === 'admin')
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await supabase
    .from('server_settings')
    .select('value')
    .eq('key', 'rp_classes')
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Normalize old string array to object array
  let classes = data?.value || []
  if (Array.isArray(classes)) {
    classes = classes.map((c: any) => {
      if (typeof c === 'string') return { name: c, roleId: '', channelId: '' }
      return c
    })
  }

  return NextResponse.json({ classes })
}

export async function POST(request: Request) {
  const supabase = createSupabaseServer()
  const { data: userRoles } = await supabase.from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

  const isAdmin = userRoles?.some(r => (r.roles as any)?.name === 'admin')
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const body = await request.json()

    // Add new class logic (Discord Role Creation)
    if (body.action === 'add') {
      const { className, channelId } = body
      let roleId = ''
      try {
        const token = process.env.DISCORD_BOT_TOKEN
        const guildId = '1216443076168515724'
        if (token) {
          const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `Classe ${className}`,
              color: 0x3498db,
              hoist: true,
              mentionable: true
            })
          })
          if (res.ok) {
            const roleData = await res.json()
            roleId = roleData.id
          } else {
            console.error('Discord API Role Creation Failed:', await res.text())
          }
        }
      } catch (err) {
        console.error('Failed to create Discord role', err)
      }

      // Fetch current classes
      const { data } = await supabase.from('server_settings').select('value').eq('key', 'rp_classes').single()
      let currentClasses = data?.value || []
      if (Array.isArray(currentClasses)) {
        currentClasses = currentClasses.map((c: any) => (typeof c === 'string' ? { name: c, roleId: '', channelId: '' } : c))
      }
      
      currentClasses.push({ name: className, roleId, channelId })

      const { error } = await supabase.from('server_settings').upsert({ key: 'rp_classes', value: currentClasses, updated_at: new Date().toISOString() })
      if (error) throw error

      return NextResponse.json({ success: true, classes: currentClasses })
    }

    // Default save classes (e.g. for deletion or bulk update)
    const { classes } = body
    if (!Array.isArray(classes)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const { error } = await supabase
      .from('server_settings')
      .upsert({ key: 'rp_classes', value: classes, updated_at: new Date().toISOString() })

    if (error) throw error

    return NextResponse.json({ success: true, classes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
