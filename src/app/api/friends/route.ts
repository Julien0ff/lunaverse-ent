import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch accepted friend relationships where the user is either user1 or user2
    const { data: friendsData, error } = await supabase
      .from('friends')
      .select('id, user1_id, user2_id, status, created_at, user1:profiles!user1_id(id, username, avatar_url, discord_status), user2:profiles!user2_id(id, username, avatar_url, discord_status)')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (error) throw error

    // Map to a cleaner user format
    const friends = (friendsData || []).map((f: any) => {
      const isUser1 = f.user1_id === user.id
      const friendProfile = isUser1 ? f.user2 : f.user1
      return {
        id: f.id,
        status: f.status,
        friend_id: friendProfile.id,
        username: friendProfile.username,
        avatar_url: friendProfile.avatar_url,
        discord_status: friendProfile.discord_status,
        created_at: f.created_at,
        is_initiator: isUser1 // Did I send the request?
      }
    })

    return NextResponse.json({ friends })
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

    const { target_id, target_username, action } = await request.json()

    if (action === 'add') {
      // Find target user if only username is provided
      let finalTargetId = target_id
      if (!finalTargetId && target_username) {
        const { data: t } = await supabase.from('profiles').select('id').eq('username', target_username).maybeSingle()
        if (t) finalTargetId = t.id
      }

      if (!finalTargetId) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
      if (finalTargetId === user.id) return NextResponse.json({ error: 'Impossible de s\'ajouter soi-même' }, { status: 400 })

      // Check existing
      const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${finalTargetId}),and(user1_id.eq.${finalTargetId},user2_id.eq.${user.id})`)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'Relation existante', status: existing.status }, { status: 400 })
      }

      // Insert as pending
      const { data: newFriend, error } = await supabase
        .from('friends')
        .insert([{ user1_id: user.id, user2_id: finalTargetId, status: 'pending' }])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, friend: newFriend })
    } 
    else if (action === 'accept' || action === 'reject' || action === 'remove') {
      if (!target_id) return NextResponse.json({ error: 'L\'ID cible est requis' }, { status: 400 })

      // Find the relationship
      const { data: rel } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${target_id}),and(user1_id.eq.${target_id},user2_id.eq.${user.id})`)
        .maybeSingle()
      
      if (!rel) return NextResponse.json({ error: 'Relation introuvable' }, { status: 404 })

      if (action === 'accept') {
        if (rel.user1_id === user.id) return NextResponse.json({ error: 'Vous de pouvez pas accepter votre propre requête' }, { status: 400 })
        const { error } = await supabase.from('friends').update({ status: 'accepted' }).eq('id', rel.id)
        if (error) throw error
        return NextResponse.json({ success: true, message: 'Demande acceptée' })
      } else {
        // Reject or Remove => delete the row
        const { error } = await supabase.from('friends').delete().eq('id', rel.id)
        if (error) throw error
        return NextResponse.json({ success: true, message: 'Relation supprimée' })
      }
    }
    
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
