import {
  createSessionHandle,
  loginQrCode,
  loginToken,
  timetableFromWeek,
  assignmentsFromWeek,
  translateToWeekNumber,
  TimetableClassLesson,
  AccountKind,
  news,
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
  // Déterminer la classe principale de l'établissement (ex: 3eA)
  const defaultClass = registeredClasses.find(c => !['2gt1', '3pm', '2pro1'].includes(c.name.toLowerCase()))?.name || '3eA'

  if (!pronoteName) return defaultClass
  const trimmed = pronoteName.trim()
  const upper = trimmed.toUpperCase()
  const clean = upper.replace(/[^A-Z0-9]/g, '')

  // 1. Mappings connus pour la classe de 3ème (3eA, 3GA, 3A, 3EA, 3ème A, 3eme A, 3°A, etc.)
  const is3A =
    ['3EA', '3GA', '3A', '3EMEA', '3MEA', '3E', '3'].includes(clean) ||
    (clean.startsWith('3') && (clean.includes('A') || clean.includes('GA') || clean.includes('EA'))) ||
    upper.includes('3EME') || upper.includes('3ÈME') || upper.includes('3È') || upper.includes('3°') || upper.includes('TROISIEME')

  if (is3A) {
    const found = registeredClasses.find(c => {
      const low = c.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return low === '3ea' || low === '3ga' || low === '3a' || low === '3emea'
    })
    if (found) return found.name
    return defaultClass
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
    return { isConnected: false, tokenExpired: false, lastError: null }
  }

  const creds = data.value as any
  const isExpired = !!creds.last_error && creds.last_error.toLowerCase().includes('expiré')

  return {
    isConnected: !isExpired,
    tokenExpired: isExpired,
    lastError: creds.last_error || null,
    lastErrorAt: creds.last_error_at || null,
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
  let loginRes: any
  let effectiveToken = creds.token
  try {
    loginRes = await loginToken(session, {
      url: creds.url,
      kind: (Number(creds.kind) || 14) as AccountKind,
      username: creds.username,
      token: creds.token,
      deviceUUID: creds.deviceUUID || randomUUID(),
      navigatorIdentifier: creds.navigatorIdentifier,
    })
    if (loginRes?.token && loginRes.token !== creds.token) {
      console.log('[PronoteSync] Nouveau jeton mobile renouvelé reçu de Pronote.')
      effectiveToken = loginRes.token
      await admin.from('server_settings').update({
        value: {
          ...creds,
          token: effectiveToken,
          last_error: null,
          last_error_at: null,
        },
        updated_at: new Date().toISOString(),
      }).eq('key', 'pronote_credentials')
    }
  } catch (err: any) {
    if (
      err?.name === 'BadCredentialsError' ||
      err?.message?.includes('challenge') ||
      err?.message?.includes('credentials')
    ) {
      const errorMsg = "Le jeton de connexion Pronote a expiré ou a été révoqué par le serveur Pronote. Veuillez déconnecter le compte et réappairer avec un nouveau QR Code."
      try {
        await admin.from('server_settings').update({
          value: {
            ...creds,
            last_error: errorMsg,
            last_error_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        }).eq('key', 'pronote_credentials')
      } catch (ign) {}
      throw new Error(errorMsg)
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
        const dayOfWeek = start.getDay() // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi

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

function cleanPronoteHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim()
}

function extractImagesFromHtml(html: string): string[] {
  if (!html) return []
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  const urls: string[] = []
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) urls.push(match[1])
  }
  return urls
}

function extractPronoteMedia(item: any): {
  images: Array<{ name: string; url: string }>
  files: Array<{ name: string; url: string }>
} {
  const allAttachments: any[] = []
  if (Array.isArray(item.attachments)) {
    allAttachments.push(...item.attachments)
  }
  if (item.question?.attachments && Array.isArray(item.question.attachments)) {
    allAttachments.push(...item.question.attachments)
  }
  if (Array.isArray(item.questions)) {
    for (const q of item.questions) {
      if (Array.isArray(q.attachments)) {
        allAttachments.push(...q.attachments)
      }
    }
  }

  const contentHtml = item.content || item.question?.content || ''
  const inlineImages = extractImagesFromHtml(contentHtml)
  for (const src of inlineImages) {
    allAttachments.push({
      name: 'image_annonce.png',
      url: src,
    })
  }

  const seenUrls = new Set<string>()
  const images: Array<{ name: string; url: string }> = []
  const files: Array<{ name: string; url: string }> = []
  const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']

  for (const att of allAttachments) {
    if (!att || !att.url || seenUrls.has(att.url)) continue
    seenUrls.add(att.url)

    const name = (att.name || '').trim()
    const lowerName = name.toLowerCase()
    const isImage = IMAGE_EXTS.some(ext => lowerName.endsWith(ext)) || att.url.toLowerCase().includes('.jpg') || att.url.toLowerCase().includes('.png')

    if (isImage) {
      images.push({ name: name || 'image.png', url: att.url })
    } else {
      files.push({ name: name || 'Document joint', url: att.url })
    }
  }

  return { images, files }
}

function buildPronoteNewsEmbed(
  item: any,
  media: { images: Array<{ name: string; url: string }>; files: Array<{ name: string; url: string }> }
) {
  const isSurvey = item.is === 'survey'
  const title = (item.title || (isSurvey ? 'Sondage de l\'établissement' : 'Information de l\'établissement')).trim()
  const author = (item.author || 'Direction / Vie Scolaire').trim()
  const category = (item.category?.name || (isSurvey ? 'Sondage' : 'Information générale')).trim()

  const creationDate = item.creationDate ? new Date(item.creationDate) : new Date()
  const dateFormatted = creationDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const descriptionLines: string[] = []

  descriptionLines.push(`👤 **Auteur :** ${author}`)
  descriptionLines.push(`📁 **Catégorie :** ${category}`)
  if (isSurvey && item.isAnonymous !== undefined) {
    descriptionLines.push(`🔒 **Type :** ${item.isAnonymous ? 'Sondage anonyme' : 'Sondage nominatif'}`)
  }
  if (item.endDate) {
    const endFormatted = new Date(item.endDate).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    descriptionLines.push(`⏳ **Date limite :** ${endFormatted}`)
  } else {
    descriptionLines.push(`📅 **Date :** ${dateFormatted}`)
  }
  descriptionLines.push('───────────────────────────────')

  if (!isSurvey) {
    const rawContent = item.content || item.question?.content || ''
    const cleanContent = cleanPronoteHtml(rawContent)
    if (cleanContent) {
      const maxLen = 3000
      descriptionLines.push(cleanContent.length > maxLen ? cleanContent.slice(0, maxLen) + '\n\n*(Texte tronqué...)*' : cleanContent)
    }
  } else {
    if (Array.isArray(item.questions) && item.questions.length > 0) {
      item.questions.forEach((q: any, qIdx: number) => {
        const qTitle = (q.fullTitle || q.title || `Question ${qIdx + 1}`).trim()
        descriptionLines.push(`**❓ Question ${qIdx + 1} : ${qTitle}**`)
        const qContent = cleanPronoteHtml(q.content || '')
        if (qContent && qContent !== qTitle) {
          descriptionLines.push(qContent)
        }
        if (Array.isArray(q.choices) && q.choices.length > 0) {
          descriptionLines.push(`*Choix proposés :*`)
          q.choices.forEach((c: any) => {
            descriptionLines.push(`▫️ ${c.value}`)
          })
        }
        descriptionLines.push('')
      })
      descriptionLines.push(`👉 *Rendez-vous sur votre espace Pronote pour voter !*`)
    }
  }

  if (media.files.length > 0) {
    descriptionLines.push('')
    descriptionLines.push('📎 **Documents joints :**')
    media.files.forEach(f => {
      descriptionLines.push(`• [${f.name}](${f.url})`)
    })
  }

  if (media.images.length > 1) {
    descriptionLines.push('')
    descriptionLines.push('🖼️ **Autres images :**')
    media.images.slice(1).forEach((img, idx) => {
      descriptionLines.push(`• [Image ${idx + 2} : ${img.name}](${img.url})`)
    })
  }

  const embed: any = {
    title: isSurvey ? `📊 SONDAGE PRONOTE : ${title.toUpperCase()}` : `📢 INFORMATION PRONOTE : ${title.toUpperCase()}`,
    description: descriptionLines.join('\n'),
    color: isSurvey ? 0xFEE75C : 0x5865F2,
    footer: {
      text: isSurvey ? 'LunaVerse ENT — Sondage Pronote' : 'LunaVerse ENT — Actualités Pronote',
    },
    timestamp: creationDate.toISOString(),
  }

  return embed
}

async function sendDiscordNewsNotification({
  channelId,
  roleMention,
  embed,
  primaryImage,
}: {
  channelId: string
  roleMention?: string
  embed: any
  primaryImage?: { name: string; url: string }
}) {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token || !channelId) return false

  // Tenter de télécharger l'image et l'envoyer comme pièce jointe directe dans Discord
  if (primaryImage?.url) {
    try {
      const imgRes = await fetch(primaryImage.url, {
        headers: {
          'User-Agent': "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 PRONOTE Mobile APP Version/2.0.11",
        },
      })

      if (imgRes.ok) {
        const ab = await imgRes.arrayBuffer()
        const buf = Buffer.from(ab)
        if (buf.length > 0 && buf.length < 8 * 1024 * 1024) {
          const safeName = primaryImage.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image.png'
          const finalEmbed = {
            ...embed,
            image: { url: `attachment://${safeName}` },
          }

          const formData = new FormData()
          formData.append(
            'payload_json',
            JSON.stringify({
              content: roleMention || undefined,
              embeds: [finalEmbed],
            })
          )
          const blob = new Blob([buf], { type: imgRes.headers.get('content-type') || 'image/png' })
          formData.append('files[0]', blob, safeName)

          const postRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${token}`,
            },
            body: formData,
          })

          if (postRes.ok) return true
        }
      }
    } catch (fetchErr) {
      console.warn('[PronoteSync] Impossible de joindre l\'image en direct, fallback embed URL:', fetchErr)
    }

    embed.image = { url: primaryImage.url }
  }

  // Envoi standard en JSON
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: roleMention || undefined,
        embeds: [embed],
      }),
    })
    return res.ok
  } catch (err) {
    console.error(`[PronoteSync] Erreur lors de l'envoi de l'annonce Pronote au salon ${channelId}:`, err)
    return false
  }
}

  // Appliquer les changements et déclencher les alertes Discord via l'API de synchronisation interne
  let results = { updatedCourses: 0, alertsSent: 0, updatedHomeworks: 0, newsSent: 0 }

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

  // 3. Récupération et synchronisation des Informations / Annonces / Sondages Pronote
  let pronoteNewsItems: any[] = []
  try {
    const newsData = await news(session)
    if (newsData && Array.isArray(newsData.items)) {
      pronoteNewsItems = newsData.items
    }
  } catch (newsErr: any) {
    console.warn('[PronoteSync] Actualités Pronote non disponibles ou erreur:', newsErr?.message || newsErr)
  }

  if (pronoteNewsItems.length > 0) {
    const { data: announcedNewsSetting } = await admin
      .from('server_settings')
      .select('value')
      .eq('key', 'pronote_announced_news')
      .maybeSingle()

    const isFirstNewsSync = !announcedNewsSetting || !announcedNewsSetting.value
    const announcedIds = new Set<string>(
      Array.isArray(announcedNewsSetting?.value) ? announcedNewsSetting.value : []
    )

    const { data: channelSettings } = await admin
      .from('server_settings')
      .select('key, value')
      .in('key', ['salon_annonces_generales', 'salon_annonces'])

    const channelMap = (channelSettings || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {})
    const generalAnnoncesChannel = String(
      channelMap.salon_annonces_generales ||
      channelMap.salon_annonces ||
      process.env.DISCORD_ANNONCES_CHANNEL_ID ||
      '1504976034750271678'
    ).replace(/[<#>]/g, '').trim()

    // Trier les annonces par date de création croissante (plus ancienne à plus récente)
    const sortedNews = [...pronoteNewsItems].sort((a, b) => {
      const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0
      const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0
      return dateA - dateB
    })

    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000

    for (const item of sortedNews) {
      if (!item || !item.id) continue
      const itemId = String(item.id)

      if (announcedIds.has(itemId)) {
        continue
      }

      const itemCreationTime = item.creationDate ? new Date(item.creationDate).getTime() : 0

      // Si c'est la toute première synchronisation, ne publier que les annonces récentes (< 3 jours)
      if (isFirstNewsSync && itemCreationTime > 0 && itemCreationTime < threeDaysAgo) {
        announcedIds.add(itemId)
        continue
      }

      const media = extractPronoteMedia(item)
      const embed = buildPronoteNewsEmbed(item, media)
      const primaryImage = media.images[0]

      // Détecter si l'annonce cible une classe spécifique
      const itemTitle = (item.title || '').toLowerCase()
      const itemCat = (item.category?.name || '').toLowerCase()
      const targetClassMatch = registeredClasses.find(c => {
        const cLow = c.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        return itemTitle.includes(cLow) || itemCat.includes(cLow)
      })

      // 1. Envoyer sur le salon d'annonces générales
      if (generalAnnoncesChannel) {
        const sent = await sendDiscordNewsNotification({
          channelId: generalAnnoncesChannel,
          embed,
          primaryImage,
        })
        if (sent) results.alertsSent++
      }

      // 2. Si une classe spécifique est ciblée et a son propre salon, envoyer également dans le salon de la classe
      if (targetClassMatch && targetClassMatch.channelId) {
        const classChannel = String(targetClassMatch.channelId).replace(/[<#>]/g, '').trim()
        if (classChannel && classChannel !== generalAnnoncesChannel) {
          const classRoleMention = targetClassMatch.roleId ? `<@&${String(targetClassMatch.roleId).replace(/[<@&>]/g, '')}>` : ''
          await sendDiscordNewsNotification({
            channelId: classChannel,
            roleMention: classRoleMention,
            embed,
            primaryImage,
          })
        }
      }

      announcedIds.add(itemId)
      results.newsSent++
    }

    // Sauvegarder les annonces traitées dans server_settings
    await admin.from('server_settings').upsert({
      key: 'pronote_announced_news',
      value: Array.from(announcedIds),
      updated_at: new Date().toISOString(),
    })
  }

  // Mettre à jour la date de dernière synchronisation et le jeton renouvelé
  const nowIso = new Date().toISOString()
  await admin
    .from('server_settings')
    .update({
      value: {
        ...creds,
        token: effectiveToken,
        last_synced_at: nowIso,
        last_error: null,
        last_error_at: null,
      },
      updated_at: nowIso,
    })
    .eq('key', 'pronote_credentials')

  return {
    success: true,
    coursesCount: results.updatedCourses,
    homeworksCount: results.updatedHomeworks,
    alertsSent: results.alertsSent,
    newsSent: results.newsSent,
    syncedAt: nowIso,
  }
}
