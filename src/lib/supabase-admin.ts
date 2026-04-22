import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client — uses the SERVICE ROLE KEY.
 * Bypasses ALL Row Level Security policies.
 * NEVER expose this on the client side.
 * Use ONLY in server-side API routes and middleware.
 */
export function createSupabaseAdmin() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey || serviceKey === 'REMPLACE_PAR_TA_CLÉ_SERVICE_ROLE_ICI') {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY manquante — RLS est actif, certaines opérations peuvent échouer.')
        // Fallback to anon key (limited by RLS)
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}
