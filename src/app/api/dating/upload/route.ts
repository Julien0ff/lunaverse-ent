import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/dating/upload
 * Uploads a file to the "dating" Supabase Storage bucket
 * and returns the public URL to use as dating_photo_url.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    if (!ALLOWED_EXT.includes(ext))
      return NextResponse.json({ error: 'Format non supporté (jpg, png, webp, gif)' }, { status: 400 })

    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 })

    const path = `${user.id}/dating_photo.${ext}`
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    const { error: uploadError } = await supabase.storage
      .from('dating')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true, // overwrite previous photo
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('dating').getPublicUrl(path)

    // Also update the profile immediately
    await supabase.from('profiles').update({ dating_photo_url: publicUrl }).eq('id', user.id)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
