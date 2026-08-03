import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Routes that don't require authentication.
 * Everything else (pages and API routes) requires a valid Supabase session.
 */
const PUBLIC_ROUTES = ['/', '/unauthorized']
const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/cron/']

function isPublicRoute(pathname: string): boolean {
    if (PUBLIC_ROUTES.includes(pathname)) return true
    return PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Set cookies on the request
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    // Rebuild the response with updated cookies
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh the session — IMPORTANT: do not write logic between createServerClient
    // and getUser(), otherwise sessions may randomly expire.
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ── OAuth Callback Forwarding: if ?code=... is present anywhere else ─
    const code = request.nextUrl.searchParams.get('code')
    if (code && !pathname.startsWith('/api/auth/callback')) {
        const callbackUrl = new URL('/api/auth/callback', request.url)
        callbackUrl.searchParams.set('code', code)
        const nextParam = request.nextUrl.searchParams.get('next')
        if (nextParam) callbackUrl.searchParams.set('next', nextParam)
        return NextResponse.redirect(callbackUrl)
    }

    // ── Public routes: allow without authentication ──────────────────────
    if (isPublicRoute(pathname)) {
        return supabaseResponse
    }

    // ── Protected routes: require authentication ─────────────────────────
    if (!user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/'
        loginUrl.searchParams.set('error', 'unauthenticated')
        return NextResponse.redirect(loginUrl)
    }

    // ── Admin routes: require 'admin' role ────────────────────────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')) {
        const isAdmin = await checkAdminRole(user.id, user)
        if (!isAdmin) {
            const unauthorizedUrl = request.nextUrl.clone()
            unauthorizedUrl.pathname = '/unauthorized'
            unauthorizedUrl.searchParams.set('reason', 'admin_required')
            return NextResponse.redirect(unauthorizedUrl)
        }
    }

    return supabaseResponse
}

/**
 * Checks if a user has admin privileges.
 * Uses the service role key to bypass RLS and read the user_roles table.
 * Also checks the ADMIN_DISCORD_IDS env var for super-admins.
 */
async function checkAdminRole(userId: string, user: any): Promise<boolean> {
    // 1. Check ENV super-admins via Discord ID
    const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub || ''
    const envAdmins = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
    if (discordId && envAdmins.includes(discordId)) return true

    // 2. Check DB roles using service role (bypasses RLS)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set — cannot verify admin role in middleware')
        return false
    }

    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: userRoles } = await adminClient
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', userId)

    return (userRoles || []).some((ur: any) => ur.role?.name === 'admin')
}

export const config = {
    matcher: [
        // Apply to all routes except Next.js internals and static files
        '/((?!_next/static|_next/image|favicon.ico|logo\\.png|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
