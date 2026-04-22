import { createSupabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * CAS-like endpoint for Pronote integration.
 * Returns the Discord ID of the currently authenticated user.
 */
export async function GET() {
  const supabase = createSupabaseServer()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('discord_id, username')
      .eq('id', session.user.id)
      .single()
    
    if (error || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }
    
    // Return the Discord ID as the CAS identifier
    return NextResponse.json({
      success: true,
      cas_id: profile.discord_id,
      username: profile.username,
      service: 'ENT LunaVerse'
    })
  } catch (error: any) {
    console.error('CAS Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
