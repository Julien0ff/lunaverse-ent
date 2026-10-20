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

    let query = admin
      .from('homeworks')
      .select('*')
      .order('due_date', { ascending: true })

    if (targetClass && targetClass !== 'all') {
      query = query.or(`target_class.eq.${targetClass},target_class.eq.all`)
    }

    const { data: homeworks, error } = await query

    if (error && error.code === '42P01') {
      return NextResponse.json({ homeworks: [], userStatus: {} })
    }

    // Get user's completion status map
    let statusMap: Record<string, boolean> = {}
    if (user?.id) {
      const { data: statuses } = await admin
        .from('user_homework_status')
        .select('homework_id, completed')
        .eq('user_id', user.id)

      if (statuses) {
        statuses.forEach((s: any) => {
          statusMap[s.homework_id] = s.completed
        })
      }
    }

    const formatted = (homeworks || []).map((hw: any) => ({
      ...hw,
      completed: !!statusMap[hw.id]
    }))

    return NextResponse.json({ homeworks: formatted })
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
    const { target_class, subject, title, description, due_date, teacher_name, notify_discord } = body

    if (!target_class || !subject || !title || !due_date) {
      return NextResponse.json({ error: 'Champs requis manquants (classe, matière, titre, date).' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    const { data: hw, error } = await admin
      .from('homeworks')
      .insert([{
        target_class,
        subject,
        title,
        description: description || '',
        due_date,
        teacher_name: teacher_name || '',
        teacher_id: user?.id
      }])
      .select()
      .single()

    if (error) throw error

    // Notification Discord sur le salon de classe si demandé
    if (notify_discord !== false) {
      await sendHomeworkDiscord(admin, hw)
    }

    return NextResponse.json({ success: true, homework: hw })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { homework_id, completed } = body

    if (!homework_id || completed === undefined) {
      return NextResponse.json({ error: 'homework_id et completed requis' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    const { error } = await admin
      .from('user_homework_status')
      .upsert({
        user_id: user.id,
        homework_id,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      }, { onConflict: 'user_id,homework_id' })

    if (error) throw error
    return NextResponse.json({ success: true, completed })
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
    const { error } = await admin.from('homeworks').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function sendHomeworkDiscord(supabase: any, hw: any) {
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

    const targetClass = classes.find((c: any) => c.name?.toLowerCase().trim() === hw.target_class?.toLowerCase().trim())
    const channelId = targetClass?.channelId ? String(targetClass.channelId).trim().replace(/[<#>]/g, '') : null
    if (!channelId) return

    const roleMention = targetClass?.roleId ? `<@&${String(targetClass.roleId).trim().replace(/[<@&>]/g, '')}>` : ''
    const dueFormatted = new Date(hw.due_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    const embed = {
      title: `📖 NOUVEAU DEVOIR : ${hw.subject.toUpperCase()}`,
      color: 0x5865F2,
      description: `**Titre :** ${hw.title}\n\n**Pour le :** 🗓️ **${dueFormatted}**\n\n**Consignes :**\n${hw.description || '_Aucune consigne spécifique._'}\n\n*Professeur : ${hw.teacher_name || 'Non spécifié'}*`,
      footer: { text: 'LunaVerse ENT — Cahier de Textes & Devoirs' },
      timestamp: new Date().toISOString()
    }

    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: roleMention ? `${roleMention} Nouveau devoir ajouté :` : undefined,
        embeds: [embed]
      })
    })
  } catch (e) {
    console.error('Error sending Discord homework notification:', e)
  }
}
