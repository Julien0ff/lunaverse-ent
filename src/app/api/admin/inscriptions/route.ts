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
    .from('inscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseServer()
  const { data: userRoles } = await supabase.from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

  const isAdmin = userRoles?.some(r => (r.roles as any)?.name === 'admin')
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { id, status, classe } = await request.json()
    if (!id || !['accepted', 'refused'].includes(status)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    if (status === 'accepted' && !classe) {
      return NextResponse.json({ error: 'Classe requise pour accepter.' }, { status: 400 })
    }

    const { data: inscription, error: fetchErr } = await supabase.from('inscriptions').select('*').eq('id', id).single()
    if (fetchErr || !inscription) throw new Error('Inscription introuvable')

    const { error } = await supabase
      .from('inscriptions')
      .update({ status, classe: classe || null, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    // --- Discord Integration ---
    const token = process.env.DISCORD_BOT_TOKEN
    const guildId = '1216443076168515724'
    const discordId = inscription.discord_id

    if (token && discordId) {
      if (status === 'refused') {
        // Send DM
        const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
          method: 'POST',
          headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_id: discordId })
        })
        if (dmRes.ok) {
          const dmChan = await dmRes.json()
          await fetch(`https://discord.com/api/v10/channels/${dmChan.id}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: "❌ Votre inscription au serveur RP a été refusée par l'administration." })
          }).catch(console.error)
        }
      } else if (status === 'accepted') {
        // Fetch member
        const memRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
          headers: { 'Authorization': `Bot ${token}` }
        })
        if (memRes.ok) {
          const memberData = await memRes.json()
          const currentRoles = memberData.roles || []
          
          const ROLE_ELEVE = '1487571354323648582'
          const ROLE_NOVA = '1487572001542508626'
          const ROLE_NEBULEUSE = '1487571897364254841'
          
          const newRoles = new Set(currentRoles)
          newRoles.add(ROLE_ELEVE)
          if (classe === 'NOV') newRoles.add(ROLE_NOVA)
          if (classe === 'NÉB') newRoles.add(ROLE_NEBULEUSE)
          
          const nick = `${inscription.prenom} ${inscription.nom.toUpperCase()}`
          
          await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ roles: Array.from(newRoles), nick })
          }).catch(console.error)
        }
      }
    }
    // ---------------------------

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
