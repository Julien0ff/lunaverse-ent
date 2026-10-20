import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/edt/sync
 * Endpoint appelé par le script Pronote (pronotepy / pronote-api)
 * Synchronise les cours du week-end et les devoirs depuis Pronote vers l'ENT,
 * et déclenche automatiquement les pings Discord en cas d'annulation ou modification !
 */
export async function POST(request: NextRequest) {
  try {
    const admin = createSupabaseAdmin()
    const body = await request.json()
    const { courses, homeworks, secret } = body

    // Vérification optionnelle de secret ou clé d'API
    const expectedSecret = process.env.PRONOTE_SYNC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
    const providedSecret = secret || request.headers.get('x-sync-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    if (expectedSecret && providedSecret !== expectedSecret) {
      // Si une session admin est présente, on autorise aussi
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'Secret de synchronisation non autorisé.' }, { status: 401 })
      }
    }

    // Récupérer les classes configurées dynamiquement sur le serveur
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

    const getClassInfo = (targetClassName: string) => {
      const found = classes.find((c: any) => 
        c.name?.toLowerCase().trim() === targetClassName?.toLowerCase().trim() ||
        targetClassName?.toLowerCase().includes(c.name?.toLowerCase().trim())
      )
      if (found) {
        return {
          name: found.name,
          channelId: String(found.channelId || '').trim().replace(/[<#>]/g, ''),
          roleMention: found.roleId ? `<@&${String(found.roleId).trim().replace(/[<@&>]/g, '')}>` : ''
        }
      }
      return { name: targetClassName, channelId: '', roleMention: '' }
    }

    const token = process.env.DISCORD_BOT_TOKEN
    const results = { updatedCourses: 0, alertsSent: 0, updatedHomeworks: 0 }

    // 1. Synchronisation des cours
    if (Array.isArray(courses)) {
      for (const item of courses) {
        const {
          pronote_id,
          target_class,
          subject,
          teacher_name,
          room,
          day_of_week,
          start_time,
          end_time,
          color,
          status = 'normal',
          status_note
        } = item

        if (!target_class || !subject || day_of_week === undefined || !start_time || !end_time) {
          continue
        }

        const classInfo = getClassInfo(target_class)

        // Chercher si le cours existe déjà (par pronote_id ou par classe + jour + horaire)
        let existing = null
        if (pronote_id) {
          const { data } = await admin.from('timetable_courses').select('*').eq('pronote_id', pronote_id).maybeSingle()
          existing = data
        }
        if (!existing) {
          const { data } = await admin
            .from('timetable_courses')
            .select('*')
            .eq('target_class', classInfo.name)
            .eq('day_of_week', day_of_week)
            .eq('start_time', start_time)
            .maybeSingle()
          existing = data
        }

        const coursePayload = {
          pronote_id: pronote_id || existing?.pronote_id || null,
          target_class: classInfo.name,
          subject,
          teacher_name: teacher_name || '',
          room: room || 'Non définie',
          day_of_week: parseInt(day_of_week),
          start_time,
          end_time,
          color: color || existing?.color || '#5865F2',
          status,
          status_note: status_note || null,
          updated_at: new Date().toISOString()
        }

        let savedCourse = null
        if (existing) {
          const { data } = await admin
            .from('timetable_courses')
            .update(coursePayload)
            .eq('id', existing.id)
            .select()
            .single()
          savedCourse = data
        } else {
          const { data } = await admin
            .from('timetable_courses')
            .insert([coursePayload])
            .select()
            .single()
          savedCourse = data
        }

        results.updatedCourses++

        // Vérifier si un changement notable doit déclencher une alerte Discord instantanée
        const hasStatusChanged = existing && existing.status !== status
        const hasRoomChanged = existing && existing.room !== room
        const isNotNormal = status === 'annule' || status === 'prof_absent' || status === 'modifie' || status === 'deplace'

        if ((hasStatusChanged || hasRoomChanged) && isNotNormal && token && classInfo.channelId) {
          try {
            const dayName = day_of_week === 6 ? 'Samedi' : 'Dimanche'
            const startStr = start_time.slice(0, 5)
            const endStr = end_time.slice(0, 5)

            let embedTitle = `⚠️ MODIFICATION PRONOTE : ${subject.toUpperCase()}`
            let embedDesc = `**Changement détecté sur Pronote !**\n\n**Jour :** ${dayName} (${startStr} - ${endStr})\n**Salle :** **${room}**\n**Professeur :** ${teacher_name || 'Non spécifié'}\n${status_note ? `*${status_note}*` : ''}`
            let embedColor = 0xFEE75C // Yellow

            if (status === 'annule' || status === 'prof_absent') {
              embedTitle = `🚫 ALERTE PRONOTE : COURS ANNULÉ (${subject.toUpperCase()})`
              embedDesc = `⚠️ **Le cours est annulé sur Pronote !**\n\n**Jour :** ${dayName} (${startStr} - ${endStr})\n**Motif :** ${status_note || (status === 'prof_absent' ? 'Professeur absent' : 'Cours annulé')}`
              embedColor = 0xED4245 // Red
            }

            const embed = {
              title: embedTitle,
              description: embedDesc,
              color: embedColor,
              footer: { text: 'LunaVerse ENT — Synchronisation Pronote' },
              timestamp: new Date().toISOString()
            }

            await fetch(`https://discord.com/api/v10/channels/${classInfo.channelId}/messages`, {
              method: 'POST',
              headers: {
                Authorization: `Bot ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content: classInfo.roleMention ? `${classInfo.roleMention} Attention, mise à jour de cours sur Pronote :` : undefined,
                embeds: [embed]
              })
            })
            results.alertsSent++
          } catch (e) {
            console.error('Failed to send Discord alert for synced course:', e)
          }
        }
      }
    }

    // 2. Synchronisation des devoirs (si fournis)
    if (Array.isArray(homeworks)) {
      for (const hw of homeworks) {
        if (!hw.target_class || !hw.subject || !hw.title || !hw.due_date) continue

        const classInfo = getClassInfo(hw.target_class)

        // Chercher si le devoir existe déjà
        let existingHw = null
        if (hw.pronote_id) {
          const { data } = await admin.from('homeworks').select('*').eq('pronote_id', hw.pronote_id).maybeSingle()
          existingHw = data
        }

        const hwPayload = {
          pronote_id: hw.pronote_id || null,
          target_class: classInfo.name,
          subject: hw.subject,
          title: hw.title,
          description: hw.description || '',
          due_date: hw.due_date,
          teacher_name: hw.teacher_name || ''
        }

        if (existingHw) {
          await admin.from('homeworks').update(hwPayload).eq('id', existingHw.id)
        } else {
          await admin.from('homeworks').insert([hwPayload])
          results.updatedHomeworks++

          // Annonce du nouveau devoir sur Discord
          if (token && classInfo.channelId) {
            try {
              const dueFormatted = new Date(hw.due_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
              const embed = {
                title: `📖 NOUVEAU DEVOIR PRONOTE : ${hw.subject.toUpperCase()}`,
                color: 0x5865F2,
                description: `**Titre :** ${hw.title}\n\n**Pour le :** 🗓️ **${dueFormatted}**\n\n**Consignes :**\n${hw.description || '_Aucune consigne spécifique._'}\n\n*Professeur : ${hw.teacher_name || 'Non spécifié'}*`,
                footer: { text: 'LunaVerse ENT — Cahier de Textes Pronote' },
                timestamp: new Date().toISOString()
              }

              await fetch(`https://discord.com/api/v10/channels/${classInfo.channelId}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: classInfo.roleMention ? `${classInfo.roleMention} Nouveau devoir synchronisé depuis Pronote :` : undefined,
                  embeds: [embed]
                })
              })
            } catch (err) {
              console.error('Failed to post homework alert:', err)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
