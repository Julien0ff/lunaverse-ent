import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/cron/metabolism
 * Decays survival stats (food, water, sleep, alcohol) over time.
 * Call every hour via Vercel Cron or external scheduler.
 * 
 * Decay rates (per hour, matching bot's per-minute check):
 *   hunger:  -5  (empty in ~20h without eating)
 *   thirst:  -8  (empty in ~12h without drinking)
 *   fatigue: -3  (empty in ~33h without sleeping)
 *   hygiene: -2  (empty in ~50h without hygiene care)
 *   alcohol: -8  (sobers up in ~12h)
 *
 * Health consequences:
 *   hunger < 20 → health -3/h (malnutrition)
 *   thirst < 20 → health -5/h (dehydration)
 *   alcohol > 80 → health -2/h (alcohol poisoning)
 *   else → health +1/h (natural recovery)
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('x-cron-secret')
  if (cronSecret && authHeader !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createSupabaseAdmin()
    const now = new Date()
    // Only tick profiles whose last tick was > 50 minutes ago
    const threshold = new Date(now.getTime() - 50 * 60 * 1000)

    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, username, health, hunger, thirst, fatigue, hygiene, alcohol, last_metabolism_tick')
      .or(`last_metabolism_tick.is.null,last_metabolism_tick.lt.${threshold.toISOString()}`)

    if (error) throw error

    const clamp = (v: number) => Math.max(0, Math.min(100, v))

    const updated: string[] = []

    for (const p of (profiles || [])) {
      const hunger  = clamp((p.hunger  ?? 100) - 5)
      const thirst  = clamp((p.thirst  ?? 100) - 8)
      const fatigue = clamp((p.fatigue ?? 100) - 3)
      const hygiene = clamp((p.hygiene ?? 100) - 2)
      const alcohol = clamp((p.alcohol ?? 0)   - 8)

      // Health consequences
      let healthDelta = 1
      if ((p.hunger  ?? 100) < 20) healthDelta -= 3
      if ((p.thirst  ?? 100) < 20) healthDelta -= 5
      if ((p.alcohol ?? 0)   > 80) healthDelta -= 2
      const health = clamp((p.health ?? 100) + healthDelta)

      await admin.from('profiles').update({
        hunger, thirst, fatigue, hygiene, alcohol, health,
        last_metabolism_tick: now.toISOString(),
      }).eq('id', p.id)

      updated.push(p.username)
    }

    return NextResponse.json({
      success: true,
      ticked: updated.length,
      timestamp: now.toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
