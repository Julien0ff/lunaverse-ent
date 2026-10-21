import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

async function checkAdminOrTeacher(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { authorized: false, user: null }

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id)

  const isStaff = (userRoles || []).some((ur: any) => {
    const name = ur.role?.name?.toLowerCase() || ''
    return name === 'admin' || name === 'professeur' || name === 'direction' || name === 'cpe'
  })

  return { authorized: isStaff, user }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const { data: { user } } = await supabase.auth.getUser()
    const { searchParams } = new URL(request.url)
    const targetClass = searchParams.get('class')
    const day = searchParams.get('day') // '6' for Samedi, '0' for Dimanche

    let query = admin
      .from('timetable_courses')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (targetClass && targetClass !== 'all') {
      const clean = targetClass.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (['3ea', '3ga', '3a', '3emea'].includes(clean)) {
        query = query.or('target_class.eq.3eA,target_class.eq.3ea,target_class.eq.3EA,target_class.eq.3GA,target_class.eq.3ga,target_class.eq.3a,target_class.eq.3A,target_class.eq.all')
      } else {
        query = query.or(`target_class.eq.${targetClass},target_class.eq.all`)
      }
    }

    if (day !== null && day !== undefined && day !== '') {
      query = query.eq('day_of_week', parseInt(day))
    }

    const { data: courses, error } = await query

    if (error) {
      console.error('[API EDT GET] Database error:', error)
      if (error.code === '42P01') {
        return NextResponse.json({ courses: [], classes: [] })
      }
    }

    // Get classes from server_settings
    const { data: classSetting } = await admin
      .from('server_settings')
      .select('value')
      .eq('key', 'rp_classes')
      .maybeSingle()

    let classes: any[] = []
    if (classSetting?.value) {
      if (Array.isArray(classSetting.value)) {
        classes = classSetting.value.map((c: any) => typeof c === 'string' ? { name: c, roleId: '', channelId: '' } : c)
      } else if (typeof classSetting.value === 'object' && Array.isArray((classSetting.value as any).classes)) {
        classes = (classSetting.value as any).classes
      }
    }

    // Exclure temporairement les classes masquées (2GT1, 3PM, 2PRO1)
    const HIDDEN_CLASSES = ['2gt1', '3pm', '2pro1']
    const visibleClasses = classes.filter((c: any) => {
      const clean = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      return !HIDDEN_CLASSES.includes(clean)
    })

    // Détection de la classe de l'élève connecté
    let studentClass: string | null = null
    if (user?.id) {
      try {
        const { data: profile } = await admin.from('profiles').select('discord_id, nickname_rp').eq('id', user.id).maybeSingle()
        if (profile?.discord_id) {
          const { data: insc } = await admin.from('inscriptions')
            .select('classe')
            .eq('discord_id', profile.discord_id)
            .in('status', ['accepted', 'completed'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (insc?.classe && insc.classe !== 'À définir') {
            studentClass = insc.classe
          }
        }
        if (!studentClass && profile?.nickname_rp && profile.nickname_rp.includes('・')) {
          const prefix = profile.nickname_rp.split('・')[0].trim()
          if (prefix) studentClass = prefix
        }
      } catch (ign) {}
    }

    return NextResponse.json({ courses: courses || [], classes: visibleClasses, studentClass })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { authorized, user } = await checkAdminOrTeacher(supabase)
    if (!authorized) {
      return NextResponse.json({ error: 'Accès réservé aux professeurs et administrateurs.' }, { status: 403 })
    }

    const body = await request.json()
    const { target_class, subject, teacher_name, room, day_of_week, start_time, end_time, color, status, status_note, notify_discord } = body

    if (!target_class || !subject || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json({ error: 'Champs requis manquants (classe, matière, jour, horaires).' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    const { data: course, error } = await admin
      .from('timetable_courses')
      .insert([{
        target_class,
        subject,
        teacher_name: teacher_name || '',
        teacher_id: user?.id,
        room: room || 'Non définie',
        day_of_week: parseInt(day_of_week),
        start_time,
        end_time,
        color: color || '#5865F2',
        status: status || 'normal',
        status_note: status_note || null
      }])
      .select()
      .single()

    if (error) throw error

    // Notification Discord si demandée
    if (notify_discord) {
      await sendCourseAlertDiscord(admin, course, 'creation')
    }

    return NextResponse.json({ success: true, course })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { authorized } = await checkAdminOrTeacher(supabase)
    if (!authorized) {
      return NextResponse.json({ error: 'Accès réservé aux professeurs et administrateurs.' }, { status: 403 })
    }

    const body = await request.json()
    const { id, notify_discord, ...updates } = body

    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const admin = createSupabaseAdmin()
    const { data: oldCourse } = await admin.from('timetable_courses').select('*').eq('id', id).single()

    const { data: course, error } = await admin
      .from('timetable_courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Alerte Discord automatique en cas de modification de statut, de salle ou d'horaire
    const statusChanged = oldCourse && oldCourse.status !== course.status
    const roomChanged = oldCourse && oldCourse.room !== course.room
    if (notify_discord || statusChanged || roomChanged) {
      await sendCourseAlertDiscord(admin, course, statusChanged ? 'status_change' : 'update')
    }

    return NextResponse.json({ success: true, course })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { authorized } = await checkAdminOrTeacher(supabase)
    if (!authorized) {
      return NextResponse.json({ error: 'Accès réservé aux professeurs et administrateurs.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const admin = createSupabaseAdmin()
    const { error } = await admin.from('timetable_courses').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function sendCourseAlertDiscord(supabase: any, course: any, actionType: 'creation' | 'status_change' | 'update') {
  try {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return

    // Find class channel & role
    const { data: classSetting } = await supabase.from('server_settings').select('value').eq('key', 'rp_classes').maybeSingle()
    let classes: any[] = []
    if (classSetting?.value) {
      if (Array.isArray(classSetting.value)) {
        classes = classSetting.value.map((c: any) => typeof c === 'string' ? { name: c, roleId: '', channelId: '' } : c)
      } else if (typeof classSetting.value === 'object' && Array.isArray((classSetting.value as any).classes)) {
        classes = (classSetting.value as any).classes
      }
    }

    const targetClass = classes.find((c: any) => c.name?.toLowerCase().trim() === course.target_class?.toLowerCase().trim())
    const channelId = targetClass?.channelId ? String(targetClass.channelId).trim().replace(/[<#>]/g, '') : null
    if (!channelId) return

    const roleMention = targetClass?.roleId ? `<@&${String(targetClass.roleId).trim().replace(/[<@&>]/g, '')}>` : ''
    const dayName = course.day_of_week === 6 ? 'Samedi' : 'Dimanche'
    const startStr = course.start_time?.slice(0, 5) || ''
    const endStr = course.end_time?.slice(0, 5) || ''

    let embedColor = 0x5865F2 // Blurple
    let title = `📚 INFO COURS : ${course.subject.toUpperCase()}`
    let desc = `**Classe :** ${course.target_class}\n**Jour :** ${dayName} (${startStr} - ${endStr})\n**Salle :** ${course.room}\n**Professeur :** ${course.teacher_name || 'Non spécifié'}`

    if (course.status === 'annule' || course.status === 'prof_absent') {
      embedColor = 0xED4245 // Red
      title = `🚫 COURS ANNULÉ : ${course.subject.toUpperCase()}`
      desc = `⚠️ **Le cours est annulé !**\n\n**Jour :** ${dayName} (${startStr} - ${endStr})\n**Motif :** ${course.status_note || (course.status === 'prof_absent' ? 'Professeur absent' : 'Cours annulé')}`
    } else if (course.status === 'modifie' || course.status === 'deplace') {
      embedColor = 0xFEE75C // Yellow/Amber
      title = `⚠️ MODIFICATION DE COURS : ${course.subject.toUpperCase()}`
      desc = `**Attention, changement sur le cours !**\n\n**Jour :** ${dayName} (${startStr} - ${endStr})\n**Salle :** **${course.room}**\n**Professeur :** ${course.teacher_name || 'Non spécifié'}\n${course.status_note ? `**Précision :** ${course.status_note}` : ''}`
    }

    const embed = {
      title,
      description: desc,
      color: embedColor,
      footer: { text: 'LunaVerse ENT — Emploi du Temps' },
      timestamp: new Date().toISOString()
    }

    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: roleMention ? `${roleMention} Attention, information sur votre cours :` : undefined,
        embeds: [embed]
      })
    })
  } catch (e) {
    console.error('Error sending Discord course alert:', e)
  }
}
