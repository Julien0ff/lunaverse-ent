'use client'

import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import Sidebar from '@/components/Sidebar'
import NotificationCenter from '@/components/NotificationCenter'
import LoadingScreen from '@/components/LoadingScreen'
import Image from 'next/image'
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
                
                {/* Mobile Top Header */}
                <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-discord-dark/90 backdrop-blur-md border-b border-white/5 z-[80] flex items-center justify-between px-5 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                            <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-white text-sm tracking-tight leading-none">LunaVerse</span>
                            <span className="text-[10px] font-bold text-discord-muted uppercase tracking-widest mt-0.5">ENT Scolaire</span>
                        </div>
                    </div>
                    <NotificationCenter />
                </header>

                {/* Main content — offset by sidebar width on desktop. Bottom padding on mobile for navbar. */}
                <main
                    className={clsx(
                        "flex-1 w-full md:ml-[280px] pt-16 md:pt-0",
                        pathname === '/messages' ? "h-[calc(100vh-125px-64px)] md:h-screen" : "min-h-screen pb-[125px] md:pb-0 overflow-y-auto"
                    )}
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
