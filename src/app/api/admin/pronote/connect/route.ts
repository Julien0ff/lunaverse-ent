import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'
import { pairPronoteWithQr, getPronoteStatus, syncPronoteData } from '@/lib/pronote-sync'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const status = await getPronoteStatus()
    return NextResponse.json(status)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const admin = createSupabaseAdmin()
    const user = await requireAdmin(supabase, admin)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const body = await request.json()
    const { action } = body

    if (action === 'pair') {
      const { qr, pin } = body
      if (!qr || !pin) {
        return NextResponse.json({ error: 'Les données du QR Code et le code PIN sont obligatoires.' }, { status: 400 })
      }
      const pairResult = await pairPronoteWithQr({ qr, pin })
      return NextResponse.json(pairResult)
    }

    if (action === 'sync') {
      try {
        const syncResult = await syncPronoteData()
        return NextResponse.json(syncResult)
      } catch (syncErr: any) {
        if (
          syncErr?.name === 'RateLimitedError' ||
          syncErr?.message?.toLowerCase().includes('rate-limit') ||
          syncErr?.message?.toLowerCase().includes('requêtes')
        ) {
          return NextResponse.json(
            { error: "Pronote a temporairement limité les requêtes (sécurité anti-flood). Veuillez patienter 1 à 2 minutes avant de relancer la synchronisation." },
            { status: 429 }
          )
        }
        return NextResponse.json({ error: syncErr?.message || 'Erreur lors de la synchronisation.' }, { status: 500 })
      }
    }

    if (action === 'verify_pin') {
      const { pin } = body
      if (!pin) {
        return NextResponse.json({ error: 'Le code PIN est obligatoire.' }, { status: 400 })
      }
      const { data: credsData } = await admin
        .from('server_settings')
        .select('value')
        .eq('key', 'pronote_credentials')
        .maybeSingle()

      if (!credsData?.value?.token) {
        return NextResponse.json({ error: "Aucun compte Pronote n'est configuré." }, { status: 400 })
      }

      const creds = credsData.value as any
      creds.pin = String(pin).trim()

      await admin.from('server_settings').update({
        value: creds,
        updated_at: new Date().toISOString(),
      }).eq('key', 'pronote_credentials')

      let syncResult = null
      let syncWarning: string | null = null
      try {
        syncResult = await syncPronoteData()
      } catch (syncErr: any) {
        console.warn('[PronoteConnect] Sync error after PIN save:', syncErr?.message || syncErr)
        if (
          syncErr?.name === 'RateLimitedError' ||
          syncErr?.message?.toLowerCase().includes('rate-limit') ||
          syncErr?.message?.toLowerCase().includes('requêtes')
        ) {
          syncWarning = "Code PIN enregistré avec succès ! Pronote applique une pause anti-flood temporaire : la synchronisation automatique s'exécutera d'ici 1 à 2 minutes."
        } else {
          syncWarning = `Code PIN enregistré, mais la synchronisation a retourné : ${syncErr?.message || syncErr}`
        }
      }

      return NextResponse.json({
        success: true,
        message: syncWarning || 'Code PIN enregistré et synchronisation exécutée avec succès.',
        warning: syncWarning || undefined,
        sync: syncResult,
      })
    }

    if (action === 'disconnect') {
      await admin.from('server_settings').delete().eq('key', 'pronote_credentials')
      return NextResponse.json({ success: true, message: 'Compte Pronote déconnecté avec succès.' })
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Une erreur est survenue.' }, { status: 500 })
  }
}
