import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updates = await req.json()
    const allowed = ['bio', 'twitter_url', 'instagram_url', 'github_url', 'website_url']
    const filtered = Object.keys(updates)
      .filter(key => allowed.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key]
        return obj
      }, {})

    const { error } = await supabase
      .from('profiles')
      .update(filtered)
      .eq('id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
