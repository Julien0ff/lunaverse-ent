import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/suggestions
 * Any logged-in user submits a shop suggestion.
 * Body: { name: string, description?: string, category?: string, estimated_price?: number }
 *
 * GET /api/admin/suggestions
 * Admin only: lists all pending suggestions.
 *
 * DELETE /api/admin/suggestions
 * Admin only: deletes a suggestion by id.
 * Body: { id: string }
 */

async function requireUser(supabase: ReturnType<typeof createSupabaseServer>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

async function isAdmin(supabase: ReturnType<typeof createSupabaseServer>, userId: string) {
  const { data } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', userId)
  return (data || []).some((ur: any) => ur.role?.name === 'admin')
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServer()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { name, description, category, estimated_price } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nom de l\'article requis' }, { status: 400 })

  const { error } = await supabase.from('shop_suggestions').insert([{
    user_id: user.id,
    name: name.trim(),
    description: description?.trim() || null,
    category: category?.trim() || null,
    estimated_price: estimated_price ? Number(estimated_price) : null,
    status: 'pending',
  }])

  if (error) {
    // If table doesn't exist yet, give a friendly message
    if (error.code === '42P01') return NextResponse.json({ error: 'Table shop_suggestions manquante — exécutez la migration SQL' }, { status: 500 })
    throw error
  }

  return NextResponse.json({ success: true, message: 'Suggestion envoyée aux admins 🎉' })
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServer()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!await isAdmin(supabase, user.id)) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  const { data, error } = await supabase
    .from('shop_suggestions')
    .select('*, author:profiles!user_id(username, avatar_url)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return NextResponse.json({ suggestions: data || [] })
}

export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServer()
  const user = await requireUser(supabase)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (!await isAdmin(supabase, user.id)) return NextResponse.json({ error: 'Admin requis' }, { status: 403 })

  const { id, action } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

  if (action === 'approve') {
    await supabase.from('shop_suggestions').update({ status: 'approved' }).eq('id', id)
  } else {
    await supabase.from('shop_suggestions').delete().eq('id', id)
  }

  return NextResponse.json({ success: true })
}
