import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Status emojis provided by user (Animated)
const EMOJI_AVAILABLE = '<a:upall:1293639606599946251>' // Il y'a de la place
const EMOJI_WARNING = '<a:pertube:1303721617536323674>' // Attention (reste peu de places)
const EMOJI_FULL = '<a:down:1293639406892355645>' // Plus de place

function getEmoji(capacity: number) {
  if (capacity >= 5) return EMOJI_AVAILABLE
  if (capacity > 0) return EMOJI_WARNING
  return EMOJI_FULL
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    
    // Check Admin
    const { data: rolesData } = await supabase.from('user_roles').select('role:roles(name)').eq('user_id', user.id)
    const isAdmin = (rolesData || []).some((ur: any) => ur.role?.name === 'admin')
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { effectifs, options, salon_effectifs } = await req.json()
    
    if (!salon_effectifs) {
      return NextResponse.json({ error: 'Veuillez renseigner l\'ID du salon Discord d\'abord.' }, { status: 400 })
    }

    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'DISCORD_BOT_TOKEN manquant.' }, { status: 500 })

    // Build the 3 sections for the embed
    const classiques = effectifs.classiques || []
    const personnel = effectifs.personnel || []
    const specialites = options || []

    let textClassiques = classiques.map((m: any) => 
      `${getEmoji(m.capacity)} **${m.name}** : ${m.capacity} place${m.capacity > 1 ? 's' : ''} libre${m.capacity > 1 ? 's' : ''}`
    ).join('\n') || '*Aucune matière enregistrée.*'

    let textSpecialites = specialites.map((s: any) => 
      `${getEmoji(s.capacity || 0)} **${s.name}** : ${s.capacity || 0} place${(s.capacity || 0) > 1 ? 's' : ''} libre${(s.capacity || 0) > 1 ? 's' : ''}`
    ).join('\n') || '*Aucune spécialité enregistrée.*'

    let textPersonnel = personnel.map((p: any) => 
      `${getEmoji(p.capacity)} **${p.name}** : ${p.capacity} place${p.capacity > 1 ? 's' : ''} libre${p.capacity > 1 ? 's' : ''}`
    ).join('\n') || '*Aucun personnel enregistré.*'

    const embed = {
      title: '📊 Liste des Effectifs & Matières',
      description: 'Voici les places disponibles pour chaque matière, spécialité et personnel scolaire.',
      color: 0x5865F2,
      fields: [
        { name: 'Matières Classiques', value: textClassiques, inline: false },
        { name: 'Spécialités / Options', value: `${textSpecialites}\n\n*Vous pourrez toujours demander la création d'une nouvelle spécialité en faisant un ticket !*`, inline: false },
        { name: 'Personnel Scolaire', value: textPersonnel, inline: false }
      ],
      footer: {
        text: 'Mis à jour automatiquement'
      },
      timestamp: new Date().toISOString()
    }

    const res = await fetch(`https://discord.com/api/v10/channels/${salon_effectifs}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ embeds: [embed] })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Discord deploy effectifs error:', errText)
      return NextResponse.json({ error: 'Erreur Discord' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
