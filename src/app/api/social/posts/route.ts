import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: posts } = await supabase
      .from('posts')
      .select('*, user:profiles(username, avatar_url, rp_name), likes(post_id, user_id), comments(id)')
      .order('created_at', { ascending: false })
      .limit(50)

    const mapped = (posts || []).map((post: any) => ({
      ...post,
      created: post.created_at,
      expand: { user: post.user },
      likes_count: post.likes ? post.likes.length : 0,
      is_liked: post.likes ? post.likes.some((l: any) => l.user_id === user.id) : false,
      comments_count: post.comments ? post.comments.length : 0,
    }))

    return NextResponse.json({ posts: mapped })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { content, image_url } = await request.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert([{ 
        user_id: user.id, 
        content: content.trim(),
        image_url: image_url || null
      }])
      .select('*, user:profiles(username, avatar_url, rp_name)')
      .single()

    if (error) throw error

    return NextResponse.json({ ...newPost, expand: { user: newPost.user } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
