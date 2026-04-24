import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { sendDiscordDM } from '@/lib/discord-api'

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServer()
  const admin = createSupabaseAdmin()
  
  // Use getUser (more reliable than getSession on server-side)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { post_id, action } = body
    
    if (!post_id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    if (action === 'like') {
      // Use admin client to bypass RLS
      const { error } = await admin
        .from('likes')
        .upsert([{ post_id, user_id: user.id }], { onConflict: 'post_id,user_id' })
      
      if (error) throw error

      const { data: post } = await admin.from('posts').select('user_id').eq('id', post_id).single()
      if (post && post.user_id !== user.id) {
        const { data: liker } = await admin.from('profiles').select('username, nickname_rp').eq('id', user.id).maybeSingle()
        await sendDiscordDM(post.user_id, {
          title: '❤️ Nouveau Like',
          color: 0xED4245,
          description: `**${liker?.nickname_rp || liker?.username || 'Quelqu\'un'}** a aimé votre post !`
        })
      }

      return NextResponse.json({ liked: true })

    } else if (action === 'unlike') {
      const { error } = await admin
        .from('likes')
        .delete()
        .eq('post_id', post_id)
        .eq('user_id', user.id)
      
      if (error) throw error
      return NextResponse.json({ liked: false })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
