import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SUBJECT_COLORS: Record<string, number> = {
  'ALLEMAND': 0x654B99, 'ANGLAIS': 0xF49737, 'ARTS PLASTIQUES': 0xED679B,
  'BRANLETTE COLLECTIVE': 0xFFED00, 'CLUB (au choix)': 0xC93E69, 'CRIMINOLOGIE': 0xC34C1F,
  'CUISINE': 0x9D526A, 'CYBERSÉCURITÉ': 0xA0FCAE, 'DROIT': 0xFFFFFF,
  'DROIT CONSTITUTIONNEL DE LA VE RÉPUBLIQUE': 0xBC5603, 'ÉDUCATION MORALE ET CIVIQUE': 0x563232,
  'ÉDUCATION MUSICALE': 0xC0C0C0, 'ÉDUCATION PHYSIQUE ET SPORTIVE': 0x9495CA, 'ESPAGNOL': 0xF08557,
  'EVENT': 0x212853, 'EXAMENS NATIONAUX': 0xE71818, 'FORMATION HUMAINE': 0xF6F0B5,
  'FRANÇAIS': 0xA2C62B, 'Gestion Etab': 0xF6F0B5, 'HISTOIRE-GÉOGRAPHIE': 0x7C302E,
  'HYMNE': 0x181E3D, 'INFIRMERIE': 0xED679B, 'MATHÉMATIQUES': 0xED6566,
  'Matière non désignée': 0xFFFFFF, 'Permanence': 0xC0C0C0, 'PHYSIQUE-CHIMIE': 0x0099DA,
  'PPMS': 0xC0C0C0, 'Prévention': 0xC0C0C0, 'Réservation de salle': 0xC0C0C0,
  'SCIENCE DE LA VIE QUOTIDIENNE': 0xFF5959, 'SCIENCES DE LA VIE ET DE LA TERRE': 0x75B951,
  'SCIENCES ÉCONOMIQUES ET SOCIALES': 0xFDCF1D, 'SORTIE SCOLAIRE': 0xA02E65,
  'TECHNOLOGIE': 0x4C4C4C, 'TP PHYSIQUE-CHIMIE': 0xAFDEF9, 'VIE POLITIQUE FRANÇAISE': 0x2B12B1
}

const ROLE_ELEVE = '1487571354323648582'
const ROLE_NOVA = '1487572001542508626'
const ROLE_NEBULEUSE = '1487571897364254841'
const INFO_TRAFIC_CHANNEL = '1504976034750271678'

async function getAdminStatus(supabase: any, userId: string) {
  const { data: roles } = await supabase.from('user_roles').select('role:roles(name)').eq('user_id', userId)
  return roles?.some((r: any) => r.role?.name?.toLowerCase() === 'admin')
}

// ── GET: Fetch all announcements ──────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await getAdminStatus(supabase, user.id))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data, error } = await supabase
      .from('course_announcements')
      .select('*, teacher:profiles!course_announcements_teacher_id_fkey(username, nickname_rp), replacement:profiles!course_announcements_replacement_teacher_id_fkey(username, nickname_rp)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ items: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST: Create a new pending announcement ─────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await getAdminStatus(supabase, user.id))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const { type, target_class, subject, teacher_id, replacement_teacher_id, start_time, end_time, info_status, info_text } = body

    if (!type) return NextResponse.json({ error: 'Type is required' }, { status: 400 })

    const { data: announcement, error: insertError } = await supabase
      .from('course_announcements')
      .insert({
        type, target_class, subject, teacher_id, replacement_teacher_id,
        start_time: start_time || null, end_time: end_time || null,
        info_status, info_text, status: 'pending' // ALWAYS pending initially
      })
      .select('*, teacher:profiles!course_announcements_teacher_id_fkey(username, nickname_rp), replacement:profiles!course_announcements_replacement_teacher_id_fkey(username, nickname_rp)')
      .single()

    if (insertError) throw insertError
    return NextResponse.json({ success: true, item: announcement })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── PUT: Update or Publish an announcement ──────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await getAdminStatus(supabase, user.id))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { id, action, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    let newStatus = undefined
    if (action === 'publish') newStatus = 'sent'
    if (action === 'unpublish') newStatus = 'pending'

    const updatePayload = { ...updates, updated_at: new Date().toISOString() }
    if (newStatus) updatePayload.status = newStatus

    const { data: announcement, error } = await supabase
      .from('course_announcements')
      .update(updatePayload)
      .eq('id', id)
      .select('*, teacher:profiles!course_announcements_teacher_id_fkey(username, nickname_rp), replacement:profiles!course_announcements_replacement_teacher_id_fkey(username, nickname_rp)')
      .single()

    if (error) throw error

    // Sync Discord if it's Info-Trafic and status changed or content updated while published
    if (announcement.type === 'info') {
      await updateDiscordInfoTraficEmbed(supabase)
    }

    return NextResponse.json({ success: true, item: announcement })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── DELETE: Remove an announcement ──────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await getAdminStatus(supabase, user.id))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { data: announcement } = await supabase.from('course_announcements').select('type, status').eq('id', id).single()

    const { error } = await supabase.from('course_announcements').delete().eq('id', id)
    if (error) throw error

    if (announcement?.type === 'info' && announcement.status === 'sent') {
      await updateDiscordInfoTraficEmbed(supabase)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── DISCORD EMBED SYNC LOGIC ────────────────────────────────────────────────────
async function updateDiscordInfoTraficEmbed(supabase: any) {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) return

  // Fetch all currently active infos
  const { data: activeInfos } = await supabase
    .from('course_announcements')
    .select('*, teacher:profiles!course_announcements_teacher_id_fkey(username, nickname_rp), replacement:profiles!course_announcements_replacement_teacher_id_fkey(username, nickname_rp)')
    .eq('type', 'info')
    .eq('status', 'sent')
    .order('created_at', { ascending: false })

  const embeds = []

  if (!activeInfos || activeInfos.length === 0) {
    embeds.push({
      title: '✅ INFO-TRAFIC : Trafic Normal',
      description: 'Aucune perturbation n\'est signalée pour le moment.',
      color: 0x57F287,
      timestamp: new Date().toISOString(),
      footer: { text: 'LunaVerse ENT — Administration' }
    })
  } else {
    for (const info of activeInfos) {
      const color = info.subject && SUBJECT_COLORS[info.subject] ? SUBJECT_COLORS[info.subject] : 0xED4245
      const teacherName = info.teacher?.nickname_rp || info.teacher?.username || 'Non spécifié'
      const replacerName = info.replacement?.nickname_rp || info.replacement?.username || 'Non spécifié'
      
      let classText = 'Général'
      if (info.target_class === 'nova') classText = 'Classe Nova'
      if (info.target_class === 'nebuleuse') classText = 'Classe Nébuleuse'

      let desc = `**Matière:** ${info.subject || 'Non spécifiée'}\n**Classe:** ${classText}`
      if (info.teacher_id) desc += `\n**Professeur concerné:** ${teacherName}`
      if (info.info_status === 'remplace' && info.replacement_teacher_id) desc += `\n**Remplacé par:** ${replacerName}`
      
      if (info.start_time) {
          const timeStr = new Date(info.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const dateStr = new Date(info.start_time).toLocaleDateString('fr-FR')
          desc += `\n**Date / Heure:** ${dateStr} à ${timeStr}`
      }

      if (info.info_text) desc += `\n\n**Information:**\n${info.info_text}`

      let titleIcon = 'ℹ️'
      if (info.info_status === 'supprime') titleIcon = '❌'
      if (info.info_status === 'remplace') titleIcon = '🔄'
      if (info.info_status === 'retard') titleIcon = '⏰'
      if (info.info_status === 'deplace') titleIcon = '📅'

      embeds.push({
        title: `${titleIcon} INFO-TRAFIC : ${info.info_status ? info.info_status.toUpperCase() : 'INFORMATION'}`,
        color: color,
        description: desc,
        timestamp: new Date(info.created_at).toISOString(),
        footer: { text: 'LunaVerse ENT — Administration' }
      })
    }
  }

  // Get message ID from server_settings
  const { data: setting } = await supabase.from('server_settings').select('value').eq('key', 'info_trafic_msg_id').maybeSingle()
  const msgId = setting?.value

  const payload = {
    content: `<@&${ROLE_ELEVE}> — Tableau d'affichage des perturbations`,
    embeds: embeds.slice(0, 10) // Discord limits to 10 embeds per message
  }

  try {
    if (msgId) {
      // Try to PATCH
      const res = await fetch(`https://discord.com/api/v10/channels/${INFO_TRAFIC_CHANNEL}/messages/${msgId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) return
    }
    
    // If no msgId or PATCH failed (message deleted), POST a new one
    const res = await fetch(`https://discord.com/api/v10/channels/${INFO_TRAFIC_CHANNEL}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (res.ok) {
      const data = await res.json()
      await supabase.from('server_settings').upsert({ key: 'info_trafic_msg_id', value: data.id, updated_at: new Date().toISOString() })
    }
  } catch (err) {
    console.error('Failed to update discord info trafic embed:', err)
  }
}
