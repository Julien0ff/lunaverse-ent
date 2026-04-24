import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: declarations, error } = await admin
      .from('declarations')
      .select(`
        *,
        profiles:user_id (username, discord_id, avatar_url, balance)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ declarations })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { declarationId, action, hasPenalty } = await request.json()

    if (!declarationId || !['accept', 'refuse'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const { data: declaration } = await admin
      .from('declarations')
      .select('*')
      .eq('id', declarationId)
      .single()

    if (!declaration) return NextResponse.json({ error: 'Déclaration introuvable' }, { status: 404 })
    if (declaration.status !== 'pending') return NextResponse.json({ error: 'Déclaration déjà traitée' }, { status: 400 })

    const { data: targetProfile } = await admin
      .from('profiles')
      .select('balance')
      .eq('id', declaration.user_id)
      .single()

    if (!targetProfile) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    if (action === 'accept') {
      const newBal = (Number(targetProfile.balance) || 0) + Number(declaration.amount)
      
      await admin.from('profiles').update({ balance: newBal }).eq('id', declaration.user_id)

      await admin.from('declarations').update({
        status: 'accepted',
        processed_at: new Date().toISOString()
      }).eq('id', declarationId)

      // Log transaction
      await admin.from('transactions').insert([{
        from_user_id: null,
        to_user_id: declaration.user_id,
        amount: declaration.amount,
        type: 'declaration',
        description: `Blanchiment d'argent accepté : ${declaration.reason}`
      }])

    } else {
      // Refuse: Money already deducted from dirty balance, so we just update status
      let fineAmount = 0
      if (hasPenalty) {
        fineAmount = Math.max(50, Math.floor(declaration.amount * 0.2)) // 20% fine, min 50
        const newBal = (Number(targetProfile.balance) || 0) - fineAmount
        await admin.from('profiles').update({ balance: newBal }).eq('id', declaration.user_id)
      }

      await admin.from('declarations').update({
        status: 'refused',
        has_penalty: !!hasPenalty,
        processed_at: new Date().toISOString()
      }).eq('id', declarationId)

      // Log transaction if penalty
      if (hasPenalty) {
         await admin.from('transactions').insert([{
          from_user_id: declaration.user_id,
          to_user_id: null,
          amount: -fineAmount,
          type: 'tax_penalty',
          description: `Pénalité fiscale suite à déclaration refusée (${declaration.reason})`
        }])
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
