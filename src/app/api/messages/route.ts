import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sendDiscordDM } from '@/lib/discord-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get('friend_id')

    if (!friendId) {
      // Return latest messages config, or you can implement a conversation list here
      // For now we just return the latest 50 messages of the user overall
      const { data: convos, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(username, avatar_url), receiver:profiles!receiver_id(username, avatar_url)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100)
        
      if (error) throw error
      return NextResponse.json({ messages: convos || [] })
    }

    // Return messages specifically with a friend
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(username, avatar_url), receiver:profiles!receiver_id(username, avatar_url)')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true }) // chronological order for a chat box
      .limit(100)

    if (error) throw error
    
    // Mark messages as read
    const unreadMessages = (messages || []).filter(m => m.receiver_id === user.id && !m.read)
    if (unreadMessages.length > 0) {
      // Async update without awaiting to respond quickly
      supabase.from('messages')
        .update({ read: true })
        .in('id', unreadMessages.map(m => m.id))
        .then()
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { receiver_id, content } = await request.json()

    if (!receiver_id || !content?.trim()) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Check if they are friends first (if required, uncomment)
    /*
    const { data: rel } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${receiver_id}),and(user1_id.eq.${receiver_id},user2_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle()
    
    if (!rel) return NextResponse.json({ error: 'Vous devez être amis pour envoyer un message' }, { status: 403 })
    */

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert([{ sender_id: user.id, receiver_id, content: content.trim() }])
      .select('*, sender:profiles!sender_id(username, avatar_url), receiver:profiles!receiver_id(username, avatar_url)')
      .single()

    if (error) throw error

    // Notify recipient
    const { data: sender } = await supabase.from('profiles').select('username, nickname_rp').eq('id', user.id).maybeSingle()
    await sendDiscordDM(receiver_id, {
      title: '💬 Nouveau Message Privé',
      color: 0x5865F2,
      description: `Vous avez reçu un message de **${sender?.nickname_rp || sender?.username || 'Inconnu'}** sur l'ENT.`
    })

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
