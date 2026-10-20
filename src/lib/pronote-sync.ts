import {
  createSessionHandle,
  loginQrCode,
  loginToken,
  timetableFromWeek,
  assignmentsFromWeek,
  translateToWeekNumber,
  TimetableClassLesson,
  AccountKind,
} from './pawnote/index.js'
import { createSupabaseAdmin } from './supabase-admin'
import { randomUUID } from 'crypto'
// @ts-ignore
import forge from 'node-forge'

export interface PronoteCredentials {
  url: string
  token: string
  username: string
  kind: AccountKind
  deviceUUID: string
  navigatorIdentifier?: string
  connected_at: string
  last_synced_at: string | null
  account_name?: string
}

/**
 * Normalise un nom de classe ou de groupe retourné par Pronote
 * vers le nom de classe correspondant dans LunaVerse ENT (server_settings.rp_classes).
 */
export function matchPronoteToEntClass(
  pronoteName: string,
  registeredClasses: Array<{ name: string }>
): string {
  if (!pronoteName) return '3GA'
  const trimmed = pronoteName.trim()
  const upper = trimmed.toUpperCase()
  const clean = upper.replace(/[^A-Z0-9]/g, '')

  // 1. Mappings connus pour la classe de 3ème (3GA, 3A, 3EA, 3ème A, 3eme A, 3°A, 3-GA, 3-A, etc.)
  const is3A =
    ['3GA', '3A', '3EA', '3EMEA', '3MEA', '3E', '3'].includes(clean) ||
    (clean.startsWith('3') && (clean.includes('A') || clean.includes('GA') || clean.includes('EA'))) ||
    upper.includes('3EME') || upper.includes('3ÈME') || upper.includes('3È') || upper.includes('3°') || upper.includes('TROISIEME')

  if (is3A) {
    const found = registeredClasses.find(c => {
      const low = c.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return low === '3ga' || low === '3a' || low === '3ea' || low === '3emea'
    })
    if (found) return found.name
    return '3GA'
  }

  // 2. 3PM
  if (clean === '3PM' || upper.includes('3PM')) {
    const found = registeredClasses.find(c => c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === '3pm')
    if (found) return found.name
    return '3PM'
  }

  // 3. 2PRO1
  if (clean === '2PRO1' || clean === '2PRO' || upper.includes('2PRO')) {
    const found = registeredClasses.find(c => {
      const low = c.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return low === '2pro1' || low === '2pro'
    })
    if (found) return found.name
    return '2PRO1'
  }

  // 4. 2GT1
  if (clean === '2GT1' || clean === '2GT' || upper.includes('2GT')) {
    const found = registeredClasses.find(c => {
      const low = c.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return low === '2gt1' || low === '2gt'
    })
    if (found) return found.name
    return '2GT1'
  }

  // 5. Recherche exacte insensible à la casse
  const exact = registeredClasses.find(c => c.name.toLowerCase() === trimmed.toLowerCase())
  if (exact) return exact.name

  // 6. Recherche floue sans caractères spéciaux
  const fuzzy = registeredClasses.find(c => c.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === clean)
  if (fuzzy) return fuzzy.name

  return trimmed
}

function decryptLoginWithPin(hexStr: string, pin: string): string | null {
  try {
    const pinBuf = forge.util.createBuffer(pin)
    const key = forge.md.md5.create().update(pinBuf.bytes()).digest()
    const iv = forge.util.createBuffer().fillWithByte(0, 16)
    const cipherBytes = forge.util.createBuffer(forge.util.binary.hex.decode(hexStr))
    const decipher = forge.cipher.createDecipher('AES-CBC', key)
    decipher.start({ iv })
    decipher.update(cipherBytes)
    if (!decipher.finish()) return null
    const text = decipher.output.toString()
    if (/^[a-zA-Z0-9._\-@]{2,50}$/.test(text)) {
      return text
    }
    return null
  } catch {
    return null
  }
}

function resolvePronotePin(loginHex: string, userEnteredPin: string): { pin: string; username: string } | null {
  if (userEnteredPin) {
    const username = decryptLoginWithPin(loginHex, userEnteredPin)
    if (username) return { pin: userEnteredPin, username }
  }
  for (let p = 0; p <= 9999; p++) {
    const candidate = String(p).padStart(4, '0')
    const username = decryptLoginWithPin(loginHex, candidate)
    if (username) {
      console.log(`[Pronote] Code PIN résolu automatiquement : ${candidate} (identifiant: ${username})`)
      return { pin: candidate, username }
    }
  }
  return null
}

/**
 * Associe l'ENT à Pronote via le QR Code Mobile généré par l'application Web de Pronote.
 */
export async function pairPronoteWithQr({ qr, pin }: { qr: string | any; pin: string }) {
  let qrObj = qr

  // Si c'est une chaîne, parsing JSON
  if (typeof qr === 'string') {
    try {
      qrObj = JSON.parse(qr.trim())
    } catch {
      throw new Error(
        "Format JSON du QR Code invalide. Veuillez coller le texte exact issu du QR code Pronote (ex: {\"login\":\"...\",\"jeton\":\"...\",\"url\":\"...\"})."
      )
    }
  }

  if (!qrObj || typeof qrObj !== 'object') {
    throw new Error('Données du QR Code manquantes.')
  }

  if (!qrObj.login || !qrObj.jeton || !qrObj.url) {
    throw new Error('Le QR Code est incomplet (champs "login", "jeton" et "url" requis).')
  }


  const pinResolved = resolvePronotePin(qrObj.login, pin.trim())
  const effectivePin = pinResolved ? pinResolved.pin : pin.trim()
  const effectiveUsername = pinResolved ? pinResolved.username : 'utilisateur'

  const session = createSessionHandle()
  const deviceUUID = randomUUID()

  // Authentification et handshake QR Code avec pawnote
  let refreshInfo: any
  try {
    refreshInfo = await loginQrCode(session, {
      deviceUUID,
      pin: effectivePin,
      qr: qrObj,
    })
  } catch (err: any) {
    console.error('[Pronote] pairPronoteWithQr error details:', err)
    if (err?.name === 'BadCredentialsError') {
      throw new Error(
        `Échec d'authentification Pronote pour "${effectiveUsername}" (code PIN: ${effectivePin}). Le jeton du QR Code a expiré (validité 10 min) ou a été invalidé. Veuillez fermer la fenêtre du QR Code sur Pronote, en générer un nouveau et réappairer immédiatement.`
      )
    }
    if (err?.name === 'AccountDisabledError') {
      throw new Error("Ce compte Pronote est désactivé.")
    }
    if (err?.name === 'AccessDeniedError') {
      throw new Error("Accès refusé par le serveur Pronote ou autorisations insuffisantes.")
    }
    if (err?.name === 'SuspendedIPError') {
      throw new Error("L'adresse IP a été temporairement suspendue par Pronote. Veuillez patienter quelques minutes.")
    }
    if (err?.name === 'PageUnavailableError' || err?.name === 'BusyPageError') {
      throw new Error("Le serveur Pronote est temporairement indisponible ou la page demandée n'a pas répondu.")
    }
    throw new Error(err?.message || "Erreur lors de l'appairage avec Pronote.")
  }

  const admin = createSupabaseAdmin()
  const creds: PronoteCredentials = {
    url: refreshInfo.url,
    token: refreshInfo.token,
    username: refreshInfo.username,
    kind: refreshInfo.kind,
    deviceUUID,
    navigatorIdentifier: refreshInfo.navigatorIdentifier,
    connected_at: new Date().toISOString(),
    last_synced_at: null,
    account_name: (session.user as any)?.name || refreshInfo.username,
  }

  // Enregistrer le token dans server_settings
  await admin.from('server_settings').upsert({
    key: 'pronote_credentials',
    value: creds,
    updated_at: new Date().toISOString(),
  })

  // Synchronisation immédiate des données
  let coursesCount = 0
  let homeworksCount = 0
  try {
    const syncRes = await syncPronoteData()
    coursesCount = syncRes.coursesCount
    homeworksCount = syncRes.homeworksCount
  } catch (syncErr: any) {
    console.warn('[PronoteSync] Premier sync post-appairage:', syncErr?.message || syncErr)
  }

  return {
    success: true,
    username: refreshInfo.username,
    accountName: creds.account_name,
    url: refreshInfo.url,
    kind: refreshInfo.kind,
    coursesCount,
    homeworksCount,
  }
}

/**
 * Récupère le statut de connexion Pronote actuel.
 */
export async function getPronoteStatus() {
  const admin = createSupabaseAdmin()
  const { data } = await admin
    .from('server_settings')
    .select('value')
    .eq('key', 'pronote_credentials')
    .maybeSingle()

  if (!data?.value || !data.value.token) {
    return { isConnected: false }
  }

  const creds = data.value as PronoteCredentials
  return {
    isConnected: true,
    url: creds.url,
    username: creds.username,
    accountName: creds.account_name || creds.username,
    kind: creds.kind,
    connectedAt: creds.connected_at,
    lastSyncedAt: creds.last_synced_at,
  }
}

/**
 * Exécute une synchronisation complète des cours du week-end et des devoirs depuis Pronote.
 */
export async function syncPronoteData() {
  const admin = createSupabaseAdmin()
  const { data: credsData } = await admin
    .from('server_settings')
    .select('value')
    .eq('key', 'pronote_credentials')
    .maybeSingle()

  if (!credsData?.value || !credsData.value.token) {
    throw new Error('Pronote n\'est pas encore appairé. Veuillez d\'abord associer votre compte via QR Code.')
  }

  const creds = credsData.value as PronoteCredentials
  const session = createSessionHandle()

  // Reconnexion avec le jeton mobile permanent
  try {
    await loginToken(session, {
      url: creds.url,
      kind: (Number(creds.kind) || 14) as AccountKind,
      username: creds.username,
      token: creds.token,
      deviceUUID: creds.deviceUUID || randomUUID(),
      navigatorIdentifier: creds.navigatorIdentifier,
    })
  } catch (err: any) {
    if (
      err?.name === 'BadCredentialsError' ||
      err?.message?.includes('challenge') ||
      err?.message?.includes('credentials')
    ) {
      throw new Error(
        "Le jeton de connexion Pronote a expiré ou a été révoqué par le serveur Pronote. Veuillez déconnecter le compte et réappairer avec un nouveau QR Code."
      )
    }
    throw err
  }

  // Récupération des classes RP déclarées
  const { data: classSetting } = await admin
    .from('server_settings')
    .select('value')
    .eq('key', 'rp_classes')
    .maybeSingle()

  let registeredClasses: Array<{ name: string; roleId?: string; channelId?: string }> = []
  if (classSetting?.value) {
    if (Array.isArray(classSetting.value)) {
      registeredClasses = classSetting.value.map((c: any) =>
        typeof c === 'string' ? { name: c } : c
      )
    } else if (typeof classSetting.value === 'object' && Array.isArray((classSetting.value as any).classes)) {
      registeredClasses = (classSetting.value as any).classes
    }
  }

  // Normalisation automatique des anciennes dénominations vers la classe canonique 3GA
  try {
    await admin.from('timetable_courses')
      .update({ target_class: '3GA' })
      .in('target_class', ['3ea', '3EA', '3a', '3A', '3-GA', '3-A', '3ème A', '3eme A'])

    await admin.from('homeworks')
      .update({ target_class: '3GA' })
      .in('target_class', ['3ea', '3EA', '3a', '3A', '3-GA', '3-A', '3ème A', '3eme A'])
  } catch (e) {
    console.warn('[PronoteSync] Notice normalisation classes DB:', e)
  }

  // Calcul des semaines à synchroniser (semaine passée, en cours, et les 3 prochaines)
  const now = new Date()
  const currentWeek = translateToWeekNumber(now, session.instance.firstMonday)
  const weeksToFetch = Array.from(new Set([
    Math.max(1, currentWeek - 1),
    currentWeek,
    currentWeek + 1,
    currentWeek + 2,
    currentWeek + 3
  ]))

  const preparedCourses: any[] = []
  const preparedHomeworks: any[] = []

  for (const weekNum of weeksToFetch) {
    try {
      const timetable = await timetableFromWeek(session, weekNum)
      for (const item of timetable.classes || []) {
        if (item.is !== 'lesson') continue
        const lesson = item as TimetableClassLesson

        const start = new Date(lesson.startDate)
        const end = new Date(lesson.endDate)
        const dayOfWeek = start.getDay() // 6 = Samedi, 0 = Dimanche

        // Strictement Samedi (6) ou Dimanche (0)
        if (dayOfWeek !== 6 && dayOfWeek !== 0) continue

        // Statut du cours
        let status = 'normal'
        if (lesson.canceled) {
          status = 'annule'
        } else if (lesson.status?.toLowerCase().includes('absent')) {
          status = 'prof_absent'
        } else if (
          lesson.status?.toLowerCase().includes('déplacé') ||
          lesson.status?.toLowerCase().includes('deplace')
        ) {
          status = 'deplace'
        } else if (lesson.status?.toLowerCase().includes('modifi')) {
          status = 'modifie'
        }

        // Classe ou groupe
        const rawGroup = lesson.groupNames?.[0] || lesson.personalNames?.[0] || ''
        const targetClass = matchPronoteToEntClass(rawGroup, registeredClasses)

        const startTimeStr = `${String(start.getHours()).padStart(2, '0')}:${String(
          start.getMinutes()
        ).padStart(2, '0')}:00`
        const endTimeStr = `${String(end.getHours()).padStart(2, '0')}:${String(
          end.getMinutes()
        ).padStart(2, '0')}:00`

        preparedCourses.push({
          pronote_id: lesson.id ? String(lesson.id) : undefined,
          target_class: targetClass,
          subject: lesson.subject?.name || 'Matière générale',
          teacher_name: lesson.teacherNames?.[0] || 'Enseignant',
          room: lesson.classrooms?.[0] || 'Salle à définir',
          day_of_week: dayOfWeek,
          start_time: startTimeStr,
          end_time: endTimeStr,
          color: lesson.backgroundColor || '#5865F2',
          status,
          status_note: lesson.status || null,
        })
      }
    } catch (errWeek) {
      console.warn(`[PronoteSync] Erreur lors de la récupération de la semaine ${weekNum}:`, errWeek)
    }

    try {
      const assignments = await assignmentsFromWeek(session, weekNum)
      for (const assign of assignments || []) {
        if (!assign.deadline) continue
        const dueDate = new Date(assign.deadline).toISOString().split('T')[0]
        const rawGroup = assign.themes?.[0]?.name || ''
        let targetClass = matchPronoteToEntClass(rawGroup, registeredClasses)
        if (targetClass === 'all' || targetClass === rawGroup) {
          // Attribuer à la classe active principale (3GA)
          const defaultClass = registeredClasses.find(c => !['2gt1', '3pm', '2pro1'].includes(c.name.toLowerCase()))?.name || '3GA'
          targetClass = defaultClass
        }

        preparedHomeworks.push({
          pronote_id: assign.id ? String(assign.id) : undefined,
          target_class: targetClass,
          subject: assign.subject?.name || 'Devoirs',
          title: assign.description?.slice(0, 80) || 'Devoir Pronote',
          description: assign.description || '',
          due_date: dueDate,
        })
      }
    } catch (errHw) {
      console.warn(`[PronoteSync] Erreur devoirs semaine ${weekNum}:`, errHw)
    }
  }

function getClassNotificationTarget(
  targetClass: string,
  registeredClasses: Array<{ name: string; roleId?: string; channelId?: string }>
) {
  const cleanTarget = (targetClass || '').trim().toLowerCase()
  const found = registeredClasses.find(c => {
    const cName = (c.name || '').trim().toLowerCase()
    return cName === cleanTarget || cleanTarget.includes(cName) || cName.includes(cleanTarget)
  })
  if (found && found.channelId) {
    const channelId = String(found.channelId).trim().replace(/[<#>]/g, '')
    const roleMention = found.roleId ? `<@&${String(found.roleId).trim().replace(/[<@&>]/g, '')}>` : ''
    return { channelId, roleMention, name: found.name }
  }
  return null
}

async function sendDiscordNotification({
  channelId,
  roleMention,
  embed,
}: {
  channelId: string
  roleMention?: string
  embed: any
}) {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token || !channelId) return false
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: roleMention ? `${roleMention} Notification Pronote :` : undefined,
        embeds: [embed],
      }),
    })
    return res.ok
  } catch (err) {
    console.error(`[PronoteSync] Erreur lors de l'envoi de l'alerte Discord au salon ${channelId}:`, err)
    return false
  }
}

  // Appliquer les changements et déclencher les alertes Discord via l'API de synchronisation interne
  let results = { updatedCourses: 0, alertsSent: 0, updatedHomeworks: 0 }

  // 1. Insertion / Upsert des cours
  for (const item of preparedCourses) {
    let existing = null
    if (item.pronote_id) {
      const { data } = await admin
        .from('timetable_courses')
        .select('*')
        .eq('pronote_id', item.pronote_id)
        .maybeSingle()
      existing = data
    }
    if (!existing) {
      const { data } = await admin
        .from('timetable_courses')
        .select('*')
        .eq('target_class', item.target_class)
        .eq('day_of_week', item.day_of_week)
        .eq('start_time', item.start_time)
        .maybeSingle()
      existing = data
    }

    if (existing) {
      const hasStatusChanged = existing.status !== item.status
      const hasRoomChanged = existing.room !== item.room
      const hasTeacherChanged = existing.teacher_name !== item.teacher_name
      const hasChanged = hasStatusChanged || hasRoomChanged || hasTeacherChanged

      await admin
        .from('timetable_courses')
        .update({
          subject: item.subject,
          teacher_name: item.teacher_name,
          room: item.room,
          color: item.color,
          status: item.status,
          status_note: item.status_note,
          pronote_id: item.pronote_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      results.updatedCourses++

      // Si un changement est survenu sur Pronote, alerter immédiatement le salon Discord de la classe
      if (hasChanged) {
        const target = getClassNotificationTarget(item.target_class, registeredClasses)
        if (target) {
          const dayName = item.day_of_week === 6 ? 'Samedi' : item.day_of_week === 0 ? 'Dimanche' : `Jour ${item.day_of_week}`
          const startStr = item.start_time.slice(0, 5)
          const endStr = item.end_time.slice(0, 5)

          let embedTitle = `⚠️ MODIFICATION PRONOTE : ${item.subject.toUpperCase()}`
          let embedDesc = `**Changement détecté sur Pronote pour la classe ${target.name} !**\n\n` +
            `**Cours :** ${item.subject}\n` +
            `**Horaire :** ${dayName} (${startStr} - ${endStr})\n` +
            `**Salle :** **${item.room}**` + (hasRoomChanged ? ` *(auparavant: ${existing.room})*` : '') + `\n` +
            `**Professeur :** ${item.teacher_name || 'Non spécifié'}` + (hasTeacherChanged ? ` *(auparavant: ${existing.teacher_name})*` : '') + `\n` +
            (item.status_note ? `*${item.status_note}*` : '')
          let embedColor = 0xFEE75C // Yellow

          if (item.status === 'annule' || item.status === 'prof_absent') {
            embedTitle = `🚫 ALERTE PRONOTE : COURS ANNULÉ (${item.subject.toUpperCase()})`
            embedDesc = `⚠️ **Le cours est annulé sur Pronote pour la classe ${target.name} !**\n\n` +
              `**Cours :** ${item.subject}\n` +
              `**Horaire :** ${dayName} (${startStr} - ${endStr})\n` +
              `**Motif :** ${item.status_note || (item.status === 'prof_absent' ? 'Professeur absent' : 'Cours annulé')}\n` +
              `**Professeur :** ${item.teacher_name || 'Non spécifié'}`
            embedColor = 0xED4245 // Red
          } else if (hasStatusChanged && item.status === 'normal') {
            embedTitle = `✅ COURS MAINTENU : ${item.subject.toUpperCase()}`
            embedDesc = `Le cours de **${item.subject}** (${dayName} ${startStr} - ${endStr}) pour la classe ${target.name} est de nouveau programmé normalement en salle **${item.room}**.`
            embedColor = 0x57F287 // Green
          }

          const embed = {
            title: embedTitle,
            description: embedDesc,
            color: embedColor,
            footer: { text: 'LunaVerse ENT — Synchronisation Pronote' },
            timestamp: new Date().toISOString(),
          }

          const sent = await sendDiscordNotification({
            channelId: target.channelId,
            roleMention: target.roleMention,
            embed,
          })
          if (sent) results.alertsSent++
        }
      }
    } else {
      await admin.from('timetable_courses').insert([
        {
          target_class: item.target_class,
          subject: item.subject,
          teacher_name: item.teacher_name,
          room: item.room,
          day_of_week: item.day_of_week,
          start_time: item.start_time,
          end_time: item.end_time,
          color: item.color,
          status: item.status,
          status_note: item.status_note,
          pronote_id: item.pronote_id,
        },
      ])
      results.updatedCourses++

      // Si le cours nouvellement importé est déjà annulé ou modifié
      if (item.status === 'annule' || item.status === 'prof_absent' || item.status === 'modifie' || item.status === 'deplace') {
        const target = getClassNotificationTarget(item.target_class, registeredClasses)
        if (target) {
          const dayName = item.day_of_week === 6 ? 'Samedi' : item.day_of_week === 0 ? 'Dimanche' : `Jour ${item.day_of_week}`
          const startStr = item.start_time.slice(0, 5)
          const endStr = item.end_time.slice(0, 5)
          const isCancel = item.status === 'annule' || item.status === 'prof_absent'

          const embed = {
            title: isCancel
              ? `🚫 ALERTE PRONOTE : COURS ANNULÉ (${item.subject.toUpperCase()})`
              : `⚠️ MODIFICATION PRONOTE : ${item.subject.toUpperCase()}`,
            description: `**Nouveau cours détecté sur Pronote pour la classe ${target.name} :**\n\n` +
              `**Cours :** ${item.subject}\n` +
              `**Horaire :** ${dayName} (${startStr} - ${endStr})\n` +
              `**Salle :** **${item.room}**\n` +
              `**Professeur :** ${item.teacher_name || 'Non spécifié'}\n` +
              `**Statut :** ${item.status_note || (isCancel ? 'Annulé' : item.status)}`,
            color: isCancel ? 0xED4245 : 0xFEE75C,
            footer: { text: 'LunaVerse ENT — Synchronisation Pronote' },
            timestamp: new Date().toISOString(),
          }

          const sent = await sendDiscordNotification({
            channelId: target.channelId,
            roleMention: target.roleMention,
            embed,
          })
          if (sent) results.alertsSent++
        }
      }
    }
  }

  // 2. Insertion / Upsert des devoirs
  for (const hw of preparedHomeworks) {
    let existingHw = null
    if (hw.pronote_id) {
      const { data } = await admin
        .from('homeworks')
        .select('id')
        .eq('pronote_id', hw.pronote_id)
        .maybeSingle()
      existingHw = data
    }

    if (existingHw) {
      await admin
        .from('homeworks')
        .update({
          subject: hw.subject,
          title: hw.title,
          description: hw.description,
          due_date: hw.due_date,
          target_class: hw.target_class,
        })
        .eq('id', existingHw.id)
      results.updatedHomeworks++
    } else {
      await admin.from('homeworks').insert([
        {
          target_class: hw.target_class,
          subject: hw.subject,
          title: hw.title,
          description: hw.description,
          due_date: hw.due_date,
          pronote_id: hw.pronote_id,
        },
      ])
      results.updatedHomeworks++

      // Alerte Discord pour le nouveau devoir !
      const target = getClassNotificationTarget(hw.target_class, registeredClasses)
      if (target) {
        const formattedDate = new Date(hw.due_date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })

        const embed = {
          title: `📝 NOUVEAU DEVOIR : ${hw.subject.toUpperCase()}`,
          description: `**Un travail à faire a été publié sur Pronote pour la classe ${target.name} !**\n\n` +
            `**Matière :** ${hw.subject}\n` +
            `**Titre :** ${hw.title}\n` +
            (hw.description && hw.description !== hw.title ? `**Consigne :**\n${hw.description.slice(0, 400)}\n\n` : '') +
            `📅 **À rendre pour :** ${formattedDate}`,
          color: 0x5865F2,
          footer: { text: 'LunaVerse ENT — Cahier de Textes Pronote' },
          timestamp: new Date().toISOString(),
        }

        const sent = await sendDiscordNotification({
          channelId: target.channelId,
          roleMention: target.roleMention,
          embed,
        })
        if (sent) results.alertsSent++
      }
    }
  }

  // Mettre à jour la date de dernière synchronisation
  const nowIso = new Date().toISOString()
  await admin
    .from('server_settings')
    .update({
      value: {
        ...creds,
        last_synced_at: nowIso,
      },
      updated_at: nowIso,
    })
    .eq('key', 'pronote_credentials')

  return {
    success: true,
    coursesCount: results.updatedCourses,
    homeworksCount: results.updatedHomeworks,
    alertsSent: results.alertsSent,
    syncedAt: nowIso,
  }
}
