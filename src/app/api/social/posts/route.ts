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

    // --- Discord Integration ---
    try {
      const { data: settingsData } = await supabase
        .from('server_settings')
        .select('value')
        .eq('key', 'social_feed_channel_id')
        .single()
      
      const channelId = settingsData?.value
      const token = process.env.DISCORD_BOT_TOKEN
      
      if (channelId && token) {
        const authorName = newPost.user.rp_name || newPost.user.username
        
        await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            embeds: [{
              author: {
                name: authorName,
                icon_url: newPost.user.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'
              },
              description: content.trim(),
              image: image_url ? { url: image_url } : undefined,
              color: 0x5865F2,
              footer: { text: "Publié sur le réseau social de l'ENT" },
              timestamp: new Date().toISOString()
            }],
            components: [{
              type: 1,
              components: [{
                type: 2,
                style: 5, // Link
                label: 'Voir sur l\'ENT',
                url: 'https://auth.rp.lunaverse.fr/social'
              }]
            }]
          })
        })
      }
    } catch (discordErr) {
      console.error('Erreur diffusion Discord (Social):', discordErr)
    }
    // ---------------------------

    return NextResponse.json({ ...newPost, expand: { user: newPost.user } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
