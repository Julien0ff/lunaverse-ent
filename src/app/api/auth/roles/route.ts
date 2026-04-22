import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/roles
 * Returns the current user's RP roles using the admin client (bypasses RLS on user_roles).
 */
export async function GET(request: Request) {
    try {
        const supabase = createSupabaseServer()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        // Fallback: accept userId from query param if server-side session cookie failed
        const url = new URL(request.url)
        const fallbackUserId = url.searchParams.get('userId')
        const userId = user?.id || fallbackUserId
        
        if (!userId) {
            console.log('[ROLES] No authenticated user found (no session, no fallback userId)')
            return NextResponse.json({ roles: [] })
        }
        if (!user?.id && fallbackUserId) {
            console.log(`[ROLES] Using fallback userId from query param: ${fallbackUserId}`)
        }

        console.log(`[ROLES] Fetching roles for user: ${userId}`)

        const admin = createSupabaseAdmin()
        const { data: userRoles } = await admin
            .from('user_roles')
            .select('role:roles (*)')
            .eq('user_id', userId)

        const roles = (userRoles || []).map((ur: any) => ur.role).filter(Boolean)
        console.log(`[ROLES] Found ${roles.length} role(s) in DB: ${roles.map((r: any) => r.name).join(', ') || 'none'}`)
        
        // --- Super Admin Injection ---
        const { data: profile } = await admin.from('profiles').select('discord_id').eq('id', userId).maybeSingle()
        if (profile) {
            console.log(`[ROLES] Discord ID: ${profile.discord_id}`)
            const envAdmins = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
            if (envAdmins.includes(profile.discord_id)) {
                console.log(`[ROLES] ✅ Super admin detected via ADMIN_DISCORD_IDS`)
                if (!roles.some(r => r.name === 'admin')) {
                    roles.push({
                        id: 'super-admin-virtual-id',
                        name: 'admin',
                        can_connect: true,
                        color: '#FF0000'
                    })
                }
            } else {
                console.log(`[ROLES] Not in ADMIN_DISCORD_IDS. ENV contains: ${(process.env.ADMIN_DISCORD_IDS || '(empty)')}`)
            }
        } else {
            console.log(`[ROLES] ⚠️ No profile found in DB for user ${userId}`)
        }

        console.log(`[ROLES] Returning ${roles.length} role(s) total: ${roles.map((r: any) => r.name).join(', ') || 'none'}`)
        return NextResponse.json({ roles })
    } catch (err: any) {
        console.error('[ROLES] Unexpected error:', err.message)
        return NextResponse.json({ roles: [] })
    }
}
