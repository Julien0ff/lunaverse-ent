import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
    await supabase.auth.getUser()

    return supabaseResponse
}

export const config = {
    matcher: [
        // Apply to all routes except Next.js internals and static files
        '/((?!_next/static|_next/image|favicon.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
