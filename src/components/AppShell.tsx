'use client'

import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import LoadingScreen from '@/components/LoadingScreen'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState, useCallback } from 'react'
import NotificationToast from '@/components/NotificationToast'
import OnboardingTutorial from '@/components/OnboardingTutorial'
import { supabase } from '@/lib/supabase'

const PUBLIC_PATHS = ['/', '/unauthorized']

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const isPublic = PUBLIC_PATHS.includes(pathname)
    const { profile, roles, loading, ready } = useAuth()
    const [notif, setNotif] = useState<{ senderName: string; message: string; avatarUrl?: string } | null>(null)
    const [showOnboarding, setShowOnboarding] = useState(false)

    // Show onboarding when profile has first_connection = true
    useEffect(() => {
        if (ready && profile?.first_connection === true && !isPublic) {
            setShowOnboarding(true)
        }
    }, [ready, profile?.first_connection, isPublic])

    const handleOnboardingComplete = useCallback(() => {
        setShowOnboarding(false)
    }, [])

    useEffect(() => {
        // Wait until AuthContext has fully loaded both profile and roles
        if (!ready || isPublic) return

        const superAdminId = process.env.NEXT_PUBLIC_ADMIN_DISCORD_ID
        const isSuperAdmin = !!superAdminId && profile?.discord_id === superAdminId
        const isAdminByRole = roles.some(r => r.name === 'admin')
        const hasAccess = isSuperAdmin || isAdminByRole || roles.some(r => r.can_connect)

        console.log(`[AppShell] discord_id=${profile?.discord_id} roles=[${roles.map(r => r.name).join(',')}] hasAccess=${hasAccess}`)

        if (!hasAccess && profile) {
            router.replace('/unauthorized')
        }
    }, [pathname, isPublic, ready, profile, roles, router])

    // Global heartbeat
    useEffect(() => {
        if (!profile?.id) return

        const heartbeat = async () => {
            await fetch('/api/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ last_seen_at: new Date().toISOString() })
            })
        }

        heartbeat()
        const interval = setInterval(heartbeat, 2 * 60 * 1000) // Every 2 mins
        return () => clearInterval(interval)
    }, [profile?.id])

    // Real-time PM listener
    useEffect(() => {
        if (!profile?.id) return

        const channel = supabase
            .channel(`pm-notifications-${profile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${profile.id}`
                },
                async (payload) => {
                    // Don't show if on the message page for THAT friend
                    if (pathname === '/messages') return

                    const { data: sender } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', payload.new.sender_id)
                        .single()
                    
                    if (sender) {
                        setNotif({
                            senderName: sender.username,
                            message: payload.new.content,
                            avatarUrl: sender.avatar_url
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile?.id, pathname])

    // Show loading screen until auth is fully ready
    if (isPublic || loading || !ready) {
        return (
            <>
                <LoadingScreen />
                {children}
            </>
        )
    }

    return (
        <>
            <LoadingScreen />
            {/* Layout : sidebar fixe + contenu scrollable */}
            <div className="flex min-h-screen relative" style={{ background: 'var(--discord-dark)' }}>
                <Sidebar />
                {/* Main content — offset by sidebar width on desktop. Bottom padding on mobile for navbar. */}
                <main
                    className="flex-1 min-h-screen overflow-y-auto w-full md:ml-[260px] pb-24 md:pb-0"
                >
                    <div className={clsx(
                        pathname === '/messages' ? "w-full h-full" : "max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8"
                    )}>
                        {children}
                    </div>
                </main>
                {notif && (
                  <NotificationToast 
                    {...notif} 
                    onClose={() => setNotif(null)} 
                  />
                )}
                {showOnboarding && (
                  <OnboardingTutorial onComplete={handleOnboardingComplete} />
                )}
            </div>
        </>
    )
}
