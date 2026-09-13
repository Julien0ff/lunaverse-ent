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

        // --- Auto-Sync Fallback if 0 roles ---
        if (roles.length === 0 && profile?.discord_id && process.env.DISCORD_BOT_TOKEN) {
            try {
                console.log('[ROLES] 0 roles found. Attempting Discord API fallback sync...');
                // 1. Get bot's guilds
                const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
                });
                
                if (guildsRes.ok) {
                    const guilds = await guildsRes.json();
                    if (guilds.length > 0) {
                        const guildId = guilds[0].id;
                        // 2. Fetch member from guild
                        const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${profile.discord_id}`, {
                            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
                        });
                        
                        if (memberRes.ok) {
                            const member = await memberRes.json();
                            const memberRoles: string[] = member.roles || [];
                            
                            // 3. Sync these roles with our DB
                            const { data: dbRoles } = await admin.from('roles').select('id, name, discord_role_id, can_connect, color');
                            if (dbRoles) {
                                for (const dbRole of dbRoles) {
                                    if (dbRole.discord_role_id && memberRoles.includes(dbRole.discord_role_id)) {
                                        await admin.from('user_roles').upsert(
                                            { user_id: userId, role_id: dbRole.id },
                                            { onConflict: 'user_id,role_id' }
                                        );
                                        // Avoid duplicate if it was already added (e.g. admin)
                                        if (!roles.some(r => r.id === dbRole.id)) {
                                            roles.push(dbRole);
                                        }
                                    }
                                }
                            }
                            console.log(`[ROLES] Fallback sync completed. Roles: ${roles.map(r => r.name).join(', ') || 'none'}`);
                        }
                    }
                }
            } catch (syncErr) {
                console.error('[ROLES] Fallback sync error:', syncErr);
            }
        }

        console.log(`[ROLES] Returning ${roles.length} role(s) total: ${roles.map((r: any) => r.name).join(', ') || 'none'}`)
        return NextResponse.json({ roles })
    } catch (err: any) {
        console.error('[ROLES] Unexpected error:', err.message)
        return NextResponse.json({ roles: [] })
    }
}
