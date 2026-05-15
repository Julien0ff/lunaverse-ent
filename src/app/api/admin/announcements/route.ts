import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const SUBJECT_COLORS: Record<string, number> = {
  'ALLEMAND': 0x654B99,
  'ANGLAIS': 0xF49737,
  'ARTS PLASTIQUES': 0xED679B,
  'BRANLETTE COLLECTIVE': 0xFFED00,
  'CLUB (au choix)': 0xC93E69,
  'CRIMINOLOGIE': 0xC34C1F,
  'CUISINE': 0x9D526A,
  'CYBERSÉCURITÉ': 0xA0FCAE,
  'DROIT': 0xFFFFFF,
  'DROIT CONSTITUTIONNEL DE LA VE RÉPUBLIQUE': 0xBC5603,
  'ÉDUCATION MORALE ET CIVIQUE': 0x563232,
  'ÉDUCATION MUSICALE': 0xC0C0C0,
  'ÉDUCATION PHYSIQUE ET SPORTIVE': 0x9495CA,
  'ESPAGNOL': 0xF08557,
  'EVENT': 0x212853,
  'EXAMENS NATIONAUX': 0xE71818,
  'FORMATION HUMAINE': 0xF6F0B5,
  'FRANÇAIS': 0xA2C62B,
  'Gestion Etab': 0xF6F0B5,
  'HISTOIRE-GÉOGRAPHIE': 0x7C302E,
  'HYMNE': 0x181E3D,
  'INFIRMERIE': 0xED679B,
  'MATHÉMATIQUES': 0xED6566,
  'Matière non désignée': 0xFFFFFF,
  'Permanence': 0xC0C0C0,
  'PHYSIQUE-CHIMIE': 0x0099DA,
  'PPMS': 0xC0C0C0,
  'Prévention': 0xC0C0C0,
  'Réservation de salle': 0xC0C0C0,
  'SCIENCE DE LA VIE QUOTIDIENNE': 0xFF5959,
  'SCIENCES DE LA VIE ET DE LA TERRE': 0x75B951,
  'SCIENCES ÉCONOMIQUES ET SOCIALES': 0xFDCF1D,
  'SORTIE SCOLAIRE': 0xA02E65,
  'TECHNOLOGIE': 0x4C4C4C,
  'TP PHYSIQUE-CHIMIE': 0xAFDEF9,
  'VIE POLITIQUE FRANÇAISE': 0x2B12B1
}

const ROLE_ELEVE = '1487571354323648582'
const ROLE_NOVA = '1487572001542508626'
const ROLE_NEBULEUSE = '1487571897364254841'
const INFO_TRAFIC_CHANNEL = '1504976034750271678'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check admin role
    const { data: roles } = await supabase.from('user_roles').select('role:roles(name)').eq('user_id', user.id)
    const isAdmin = roles?.some((r: any) => r.role?.name?.toLowerCase() === 'admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { type, target_class, subject, teacher_id, replacement_teacher_id, start_time, end_time, info_status, info_text } = body

    if (!type) return NextResponse.json({ error: 'Type is required' }, { status: 400 })

    const dbStatus = type === 'info' ? 'sent' : 'pending'

    // Insert into DB
    const { data: announcement, error: insertError } = await supabase
      .from('course_announcements')
      .insert({
        type,
        target_class,
        subject,
        teacher_id,
        replacement_teacher_id,
        start_time: start_time || null,
        end_time: end_time || null,
        info_status,
        info_text,
        status: dbStatus
      })
      .select('*, teacher:profiles!course_announcements_teacher_id_fkey(username, nickname_rp), replacement:profiles!course_announcements_replacement_teacher_id_fkey(username, nickname_rp)')
      .single()

    if (insertError) throw insertError

    // If it's an immediate info-trafic announcement, send it to Discord
    if (type === 'info') {
      const token = process.env.DISCORD_BOT_TOKEN
      if (token) {
        let roleMention = `<@&${ROLE_ELEVE}>`
        let classText = 'Général'
        
        if (target_class === 'nova') {
            roleMention = `<@&${ROLE_NOVA}>`
            classText = 'Classe Nova'
        } else if (target_class === 'nebuleuse') {
            roleMention = `<@&${ROLE_NEBULEUSE}>`
            classText = 'Classe Nébuleuse'
        }

        const color = subject && SUBJECT_COLORS[subject] ? SUBJECT_COLORS[subject] : 0xED4245 // Red default for info
        const teacherName = announcement.teacher?.nickname_rp || announcement.teacher?.username || 'Non spécifié'
        const replacerName = announcement.replacement?.nickname_rp || announcement.replacement?.username || 'Non spécifié'
        
        let description = `**Matière:** ${subject || 'Non spécifiée'}\n**Classe:** ${classText}`
        if (teacher_id) {
          description += `\n**Professeur concerné:** ${teacherName}`
        }
        
        if (info_status === 'remplace' && replacement_teacher_id) {
            description += `\n**Remplacé par:** ${replacerName}`
        }
        
        if (start_time) {
            const timeStr = new Date(start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const dateStr = new Date(start_time).toLocaleDateString('fr-FR')
            description += `\n**Date / Heure:** ${dateStr} à ${timeStr}`
        }

        if (info_text) {
            description += `\n\n**Information:**\n${info_text}`
        }

        let titleIcon = 'ℹ️'
        if (info_status === 'supprime') titleIcon = '❌'
        if (info_status === 'remplace') titleIcon = '🔄'
        if (info_status === 'retard') titleIcon = '⏰'
        if (info_status === 'deplace') titleIcon = '📅'

        const embedData = {
          title: `${titleIcon} INFO-TRAFIC : ${info_status ? info_status.toUpperCase() : 'INFORMATION'}`,
          color: color,
          description: description,
          timestamp: new Date().toISOString(),
          footer: { text: 'LunaVerse ENT — Administration' }
        }

        await fetch(`https://discord.com/api/v10/channels/${INFO_TRAFIC_CHANNEL}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: roleMention,
            embeds: [embedData]
          })
        }).catch(err => console.error('Failed to send info-trafic to discord:', err))
      }
    }

    return NextResponse.json({ success: true, item: announcement })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
