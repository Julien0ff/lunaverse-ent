import { NextRequest, NextResponse } from 'next/server'
import { syncPronoteData } from '@/lib/pronote-sync'
import { createSupabaseServer } from '@/lib/supabase-server'

/**
 * GET/POST /api/cron/pronote
 * Synchronise automatiquement l'EDT et les devoirs Pronote et envoie les alertes Discord.
 * Déclenché par Vercel Cron, GitHub Actions, ou tout webhook/service cron externe.
 */
export async function GET(request: NextRequest) {
  return handleSync(request)
}

export async function POST(request: NextRequest) {
  return handleSync(request)
}

async function handleSync(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const xCronSecret = request.headers.get('x-cron-secret')

    // Si CRON_SECRET est défini, vérifier le secret
    if (cronSecret) {
      const isBearerMatch = authHeader === `Bearer ${cronSecret}`
      const isDirectMatch = authHeader === cronSecret || xCronSecret === cronSecret
      if (!isBearerMatch && !isDirectMatch) {
        // Autoriser si une session admin valide est présente
        try {
          const supabase = createSupabaseServer()
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (!user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
          }
        } catch {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }
      }
    }

    const result = await syncPronoteData()
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[Cron Pronote] Erreur synchronisation:', err)
    return NextResponse.json(
      { error: err?.message || 'Erreur lors de la synchronisation Pronote.' },
      { status: 500 }
    )
  }
}
