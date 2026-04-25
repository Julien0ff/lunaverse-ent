import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: house, error } = await supabase
      .from('houses')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ house })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Nom de maison requis' }, { status: 400 })

    // Check if already has a house or pending request
    const { data: existing } = await supabase.from('houses').select('id').eq('owner_id', user.id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Vous avez déjà une maison ou une demande en cours' }, { status: 400 })

    const { data: house, error } = await supabase
      .from('houses')
      .insert([{ owner_id: user.id, name, status: 'pending' }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, house })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
