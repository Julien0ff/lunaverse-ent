import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/finance/taxes
 * Admin only: record a tax or fine targeting one or more users.
 * Body: { target_ids: string[], reason: string, amount: number }
 *
 * GET /api/finance/taxes
 * Admin only: returns the full finance_publique log.
 */

async function requireAdmin(supabase: ReturnType<typeof createSupabaseServer>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', user.id)
  const isAdmin = (data || []).some((ur: any) => ur.role?.name === 'admin')
  return isAdmin ? user : null
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServer()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  const { target_ids, reason, amount } = await request.json()
  if (!target_ids?.length || !reason || !amount)
    return NextResponse.json({ error: 'Champs requis: target_ids, reason, amount' }, { status: 400 })

  const adminClient = createSupabaseAdmin()

  const rows = target_ids.map((tid: string) => ({
    target_id: tid,
    admin_id: admin.id,
    reason,
    amount: Math.abs(amount),
    type: 'tax',
  }))

  const { error } = await adminClient.from('finance_publique').insert(rows)
  if (error) {
    if (error.code === '42P01')
      return NextResponse.json({ error: 'Table finance_publique manquante — exécutez la migration SQL' }, { status: 500 })
    throw error
  }

  // Optionally deduct from their balance too (admin decision)
  // For now we only log — balance deduction is manual via the bank transfer
  return NextResponse.json({ success: true, message: `${target_ids.length} taxe(s) enregistrée(s)` })
}

export async function GET() {
  const supabase = createSupabaseServer()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  const adminClient = createSupabaseAdmin()
  const { data, error } = await adminClient
    .from('finance_publique')
    .select('*, target:profiles!target_id(username, discord_id), admin:profiles!admin_id(username)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error
  return NextResponse.json({ records: data || [] })
}
