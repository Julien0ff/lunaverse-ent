import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { targetId, liked } = await req.json()
    
    if (!targetId || typeof liked !== 'boolean') {
      return NextResponse.json({ error: 'Missing targetId or liked flag' }, { status: 400 })
    }

    // Insert swipe
    const { error: insertError } = await supabase
      .from('dating_swipes')
      .upsert({ swiper_id: user.id, swiped_id: targetId, liked: liked }, { onConflict: 'swiper_id,swiped_id' })

    if (insertError) throw insertError

    let isMatch = false

    // Check match if liked
    if (liked) {
      const { data: mutual } = await supabase
        .from('dating_swipes')
        .select('id')
        .eq('swiper_id', targetId)
        .eq('swiped_id', user.id)
        .eq('liked', true)
        .single()

      if (mutual) {
        isMatch = true
        
        // Créer une relation d'amitié automatique pour qu'ils puissent se parler
        // On vérifie d'abord si elle existe
        const { data: existingFriend } = await supabase
          .from('friends')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${user.id})`)
          .maybeSingle()

        if (!existingFriend) {
          await supabase.from('friends').insert([{
            user1_id: user.id,
            user2_id: targetId,
            status: 'accepted'
          }])
        } else {
          await supabase.from('friends').update({ status: 'accepted' }).eq('id', existingFriend.id)
        }
      }
    }

    return NextResponse.json({ success: true, isMatch })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
