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

    const [annRes, settingsRes] = await Promise.all([
      supabase
        .from('course_announcements')
        .select('*, teacher:profiles!teacher_id(username, nickname_rp), replacement:profiles!replacement_teacher_id(username, nickname_rp)')
        .order('created_at', { ascending: false }),
      supabase
        .from('server_settings')
        .select('key, value')
        .in('key', ['salon_annonces', 'effectifs_data'])
    ])

    if (annRes.error) throw annRes.error

    const settings = (settingsRes.data || []).reduce((acc: any, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    // Extract subjects from effectifs_data
    const classiques = settings.effectifs_data?.classiques || []
    const matieres = classiques.map((c: any) => c.name)

    return NextResponse.json({ 
      items: annRes.data,
      salon_annonces: settings.salon_annonces || '',
      matieres: matieres.length > 0 ? matieres : Object.keys(SUBJECT_COLORS)
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── POST: Create a new pending announcement ─────────────────────────────────────
// ── POST: Create a new announcement ─────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !(await getAdminStatus(supabase, user.id))) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const body = await req.json()
    const { type, target_class, subject, teacher_id, replacement_teacher_id, start_time, end_time, info_status, info_text, publish } = body

    if (!type) return NextResponse.json({ error: 'Type is required' }, { status: 400 })

    const tId = teacher_id || null
    const rTid = replacement_teacher_id || null
    const initialStatus = publish ? 'sent' : 'pending'

    const { data: announcement, error: insertError } = await supabase
      .from('course_announcements')
      .insert({
        type, target_class: target_class || 'all', subject, teacher_id: tId, replacement_teacher_id: rTid,
        start_time: start_time || null, end_time: end_time || null,
        info_status, info_text, status: initialStatus
      })
      .select('*, teacher:profiles!teacher_id(username, nickname_rp), replacement:profiles!replacement_teacher_id(username, nickname_rp)')
      .single()

    if (insertError) throw insertError

    if (initialStatus === 'sent' && announcement.type === 'info') {
      try {
        await updateDiscordInfoTraficEmbed(supabase)
      } catch (err) {
        console.error('Error syncing Discord on POST:', err)
      }
    }

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

    const updatePayload = { ...updates }
    if (newStatus) updatePayload.status = newStatus
    
    // Fix empty strings for UUID fields
    if (updatePayload.teacher_id === '') updatePayload.teacher_id = null
    if (updatePayload.replacement_teacher_id === '') updatePayload.replacement_teacher_id = null

    const { data: announcement, error } = await supabase
      .from('course_announcements')
      .update(updatePayload)
      .eq('id', id)
      .select('*, teacher:profiles!teacher_id(username, nickname_rp), replacement:profiles!replacement_teacher_id(username, nickname_rp)')
      .single()

    if (error) throw error

    // Sync Discord if it's Info-Trafic and status changed or content updated while published
    if (announcement.type === 'info') {
      try {
        await updateDiscordInfoTraficEmbed(supabase)
      } catch (err) {
        console.error('Error syncing Discord:', err)
      }
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
    .select('*, teacher:profiles!teacher_id(username, nickname_rp), replacement:profiles!replacement_teacher_id(username, nickname_rp)')
    .eq('type', 'info')
    .eq('status', 'sent')
    .order('created_at', { ascending: false })

  const infos = activeInfos || []

  // Group by target class
  const classInfos = new Map<string, any[]>()
  classInfos.set('all', []) // Global

  for (const info of infos) {
    const target = (info.target_class || 'all').trim()
    if (!classInfos.has(target)) classInfos.set(target, [])
    classInfos.get(target)!.push(info)
  }

  // Get classes and settings from server_settings
  const { data: settingsData } = await supabase
    .from('server_settings')
    .select('key, value')
    .in('key', ['rp_classes', 'info_trafic_msg_id', 'salon_annonces'])
  
  const settings = (settingsData || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {})
  
  // Safely parse classes whether stored as JSONB array, JSON string, or object
  let classes: any[] = []
  try { 
    const raw = settings.rp_classes
    if (Array.isArray(raw)) {
      classes = raw
    } else if (typeof raw === 'string') {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) classes = parsed
    }
  } catch (e) {
    console.error('Failed to parse rp_classes in updateDiscordInfoTraficEmbed:', e)
  }

  const rawAnnonces = settings.salon_annonces || INFO_TRAFIC_CHANNEL
  const annoncesChannel = String(rawAnnonces).replace(/[<#>]/g, '').trim()

  // Function to format embeds for a specific target
  const getPayload = (targetInfos: any[], targetName: string, roleId?: string) => {
    const embeds = []
    if (targetInfos.length === 0) {
      embeds.push({
        title: targetName === 'all' ? '✅ ANNONCES : Fonctionnement Normal' : `✅ ANNONCES : Fonctionnement Normal (${targetName})`,
        description: targetName === 'all' ? 'Aucune annonce en cours pour le moment.' : `Aucune perturbation ni annonce pour la classe ${targetName}.`,
        color: 0x57F287,
        timestamp: new Date().toISOString(),
        footer: { text: 'LunaVerse ENT — Administration' }
      })
    } else {
      for (const info of targetInfos) {
        const color = info.subject && SUBJECT_COLORS[info.subject] ? SUBJECT_COLORS[info.subject] : 0xED4245
        const teacherName = info.teacher?.nickname_rp || info.teacher?.username || 'Non spécifié'
        const replacerName = info.replacement?.nickname_rp || info.replacement?.username || 'Non spécifié'
        
        let desc = `**Matière:** ${info.subject || 'Non spécifiée'}\n**Classe:** ${targetName}`
        if (info.teacher_id) desc += `\n**Professeur concerné:** ${teacherName}`
        if (info.info_status === 'remplace' && info.replacement_teacher_id) desc += `\n**Remplacé par:** ${replacerName}`
        
        if (info.start_time) {
            const timeStr = new Date(info.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const dateStr = new Date(info.start_time).toLocaleDateString('fr-FR')
            desc += `\n**Date / Heure:** ${dateStr} à ${timeStr}`
        }

        if (info.info_status === 'annonce_cours' && info.info_text) {
          desc += `\n\n**Salle de cours :** ${info.info_text}`
        } else if (info.info_text) {
          desc += `\n\n**Information:**\n${info.info_text}`
        }

        let titleIcon = 'ℹ️'
        let statusTitle = info.info_status ? info.info_status.toUpperCase() : 'INFORMATION'
        
        if (info.info_status === 'supprime') { titleIcon = '❌'; statusTitle = 'COURS SUPPRIMÉ' }
        if (info.info_status === 'remplace') { titleIcon = '🔄'; statusTitle = 'COURS REMPLACÉ' }
        if (info.info_status === 'retard') { titleIcon = '⏰'; statusTitle = 'PROFESSEUR EN RETARD' }
        if (info.info_status === 'deplace') { titleIcon = '📅'; statusTitle = 'COURS DÉPLACÉ' }
        if (info.info_status === 'annonce_cours') { titleIcon = '🆕'; statusTitle = 'NOUVEAU COURS' }

        embeds.push({
          title: `${titleIcon} ANNONCE : ${statusTitle}`,
          color: color,
          description: desc,
          timestamp: new Date(info.created_at).toISOString(),
          footer: { text: 'LunaVerse ENT — Administration' }
        })
      }
    }
    
    const cleanRoleId = roleId ? String(roleId).replace(/[<@&>]/g, '').trim() : ''
    const roleMention = cleanRoleId ? `<@&${cleanRoleId}>` : (targetName === 'all' ? `<@&${ROLE_ELEVE}>` : '')

    return {
      content: targetName === 'all' 
        ? `<@&${ROLE_ELEVE}> — Tableau d'affichage des annonces` 
        : `${roleMention ? `${roleMention} — ` : ''}Tableau d'affichage des annonces — Classe ${targetName}`,
      embeds: embeds.slice(0, 10)
    }
  }

  // 1. Update global channel (target: all)
  const globalPayload = getPayload(classInfos.get('all') || [], 'all')
  const msgId = typeof settings.info_trafic_msg_id === 'string' 
    ? settings.info_trafic_msg_id 
    : (settings.info_trafic_msg_id ? String(settings.info_trafic_msg_id).replace(/"/g, '') : null)

  try {
    if (msgId && annoncesChannel) {
      const res = await fetch(`https://discord.com/api/v10/channels/${annoncesChannel}/messages/${msgId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(globalPayload)
      })
      if (!res.ok) {
        const errText = await res.text()
        console.warn('Info-Trafic PATCH failed:', errText, 'Attempting POST...')
        throw new Error('PATCH failed')
      }
    } else {
      throw new Error('No msgId or channel')
    }
  } catch (err) {
    try {
      if (annoncesChannel) {
        const res = await fetch(`https://discord.com/api/v10/channels/${annoncesChannel}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(globalPayload)
        })
        if (res.ok) {
          const data = await res.json()
          await supabase.from('server_settings').upsert({ key: 'info_trafic_msg_id', value: data.id, updated_at: new Date().toISOString() })
        } else {
          const errText = await res.text()
          console.error('Info-Trafic POST failed:', errText)
        }
      } else {
        console.error('No annoncesChannel defined for global info-trafic')
      }
    } catch (e) {
      console.error('Failed to post to global info trafic:', e)
    }
  }

  // 2. Update each class channel
  for (const c of classes) {
    const cleanChannelId = String(c.channelId || '').trim().replace(/[<#>]/g, '')
    if (!cleanChannelId) continue

    // Find all announcements matching this class name (case insensitive)
    const targetInfos: any[] = []
    classInfos.forEach((list, targetKey) => {
      if (targetKey.toLowerCase() === c.name.trim().toLowerCase()) {
        targetInfos.push(...list)
      }
    })

    const payload = getPayload(targetInfos, c.name, c.roleId)
    
    const settingKey = `info_trafic_msg_id_${c.name.trim()}`
    const { data: cSet } = await supabase.from('server_settings').select('value').eq('key', settingKey).maybeSingle()
    const cMsgId = typeof cSet?.value === 'string' ? cSet.value : (cSet?.value ? String(cSet.value).replace(/"/g, '') : null)

    try {
      if (cMsgId) {
        const res = await fetch(`https://discord.com/api/v10/channels/${cleanChannelId}/messages/${cMsgId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const patchErr = await res.text()
          console.warn(`Class ${c.name} PATCH failed: ${patchErr}, attempting POST...`)
          throw new Error('PATCH failed')
        }
      } else {
        throw new Error('No msgId')
      }
    } catch (err) {
      try {
        const res = await fetch(`https://discord.com/api/v10/channels/${cleanChannelId}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          const data = await res.json()
          await supabase.from('server_settings').upsert({ key: settingKey, value: data.id, updated_at: new Date().toISOString() })
        } else {
          const postErr = await res.text()
          console.error(`Class ${c.name} POST failed: ${postErr}`)
        }
      } catch (e) {
        console.error(`Failed to post to class ${c.name} info trafic:`, e)
      }
    }
  }
}

