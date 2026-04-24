import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendDiscordDM } from '@/lib/discord-api'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServer()
  const { searchParams } = new URL(request.url)
  const post_id = searchParams.get('post_id')
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  if (!post_id) {
    return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
  }
  
  try {
    const { data: comments, error, count } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles (username, avatar_url)
      `, { count: 'exact' })
      .eq('post_id', post_id)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    const formattedComments = (comments || []).map((comment: any) => ({
      ...comment,
      expand: {
        user: comment.user
      }
    }))
    
    return NextResponse.json({ items: formattedComments, totalItems: count || 0 })
  } catch (error: any) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServer()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { post_id, content } = body
    
    if (!post_id || !content) {
      return NextResponse.json({ error: 'Post ID and content required' }, { status: 400 })
    }
    
    const { data: newComment, error } = await supabase
      .from('comments')
      .insert([
        {
          post_id,
          user_id: session.user.id,
          content
        }
      ])
      .select(`
        *,
        user:profiles (username, avatar_url)
      `)
      .single()
    
    if (error) throw error

    const { data: post } = await supabase.from('posts').select('user_id').eq('id', post_id).single()
    
    if (post && post.user_id !== session.user.id) {
      const { data: commenter } = await supabase.from('profiles').select('username, nickname_rp').eq('id', session.user.id).maybeSingle()
      await sendDiscordDM(post.user_id, {
        title: '💬 Nouveau Commentaire',
        color: 0x5865F2,
        description: `**${commenter?.nickname_rp || commenter?.username || 'Quelqu\'un'}** a commenté votre post.\n\n_"${content}"_`
      })
    }
    
    return NextResponse.json({
      ...newComment,
      expand: {
        user: newComment.user
      }
    })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
