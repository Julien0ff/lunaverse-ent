import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Client Supabase pour le navigateur.
 * createBrowserClient (from @supabase/ssr) stocke automatiquement
 * la session dans des cookies HTTP — lisibles côté serveur (API routes).
 * Contrairement au createClient de base qui utilise localStorage.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
