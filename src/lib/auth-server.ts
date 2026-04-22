import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side helper to verify if the currently logged-in user has admin privileges.
 * Checks both the 'user_roles' table and the 'ADMIN_DISCORD_IDS' environment variable.
 */
export async function requireAdmin(supabase: SupabaseClient, admin: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 1. Get user profile to get their discord_id
    const { data: profile } = await admin
        .from('profiles')
        .select('discord_id')
        .eq('id', user.id)
        .maybeSingle()

    // 2. Check ENV Super-Admins bootstrap
    const envAdmins = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
    if (profile && envAdmins.includes(profile.discord_id)) {
        return user
    }

    // 3. Check DB roles
    const { data: userRoles } = await admin
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', user.id)

    const isAdmin = (userRoles || []).some((ur: any) => (ur.role as any)?.name === 'admin')
    
    return isAdmin ? user : null
}
