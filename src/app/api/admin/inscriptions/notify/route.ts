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

    // --- Discord Member Automation (Nickname & Roles) ---
    try {
      const guildId = '1216443076168515724'
      
      // Fetch classes from settings to get the role ID
      const { data: classesData } = await supabase
        .from('server_settings')
        .select('value')
        .eq('key', 'rp_classes')
        .single()
      
      let classRoleId = null
      if (classesData?.value && Array.isArray(classesData.value)) {
        const classeDef = classesData.value.find((c: any) => c.name === inscription.classe)
        if (classeDef && classeDef.roleId) {
          classRoleId = classeDef.roleId
        }
      }

      // Fetch member and roles
      const [memRes, rolesRes] = await Promise.all([
        fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${targetUserId}`, {
          headers: { 'Authorization': `Bot ${token}` }
        }),
        fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
          headers: { 'Authorization': `Bot ${token}` }
        })
      ])

      if (memRes.ok && rolesRes.ok) {
        const memberData = await memRes.json()
        const rolesData = await rolesRes.json()
        
        const currentRoles = memberData.roles || []
        const newRoles = new Set<string>(currentRoles)
        
        const eleveRole = rolesData.find((r: any) => r.name.toLowerCase() === 'élève' || r.name.toLowerCase() === 'eleve')
        const ROLE_ELEVE = eleveRole ? eleveRole.id : '1487571354323648582'
        
        newRoles.add(ROLE_ELEVE)
        if (classRoleId) {
          newRoles.add(classRoleId)
        }
        
        // Add option roles
        if (inscription.options && Array.isArray(inscription.options) && inscription.options.length > 0) {
          const { data: dbRoles } = await supabase.from('roles').select('discord_role_id').in('name', inscription.options)
          if (dbRoles) {
            dbRoles.forEach(r => {
              if (r.discord_role_id) newRoles.add(r.discord_role_id)
            })
          }
        }

        const nick = inscription.classe 
          ? `${inscription.classe}・${inscription.prenom} ${inscription.nom.toUpperCase()}`
          : `${inscription.prenom} ${inscription.nom.toUpperCase()}`
          
        let finalNick = nick.substring(0, 32)
        
        await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${targetUserId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ roles: Array.from(newRoles), nick: finalNick })
        })
      }
    } catch (err) {
      console.error('Discord automation error:', err)
    }
    // ----------------------------------------------------

    // Update status to 'completed'
    await supabase.from('inscriptions').update({ status: 'completed' }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
