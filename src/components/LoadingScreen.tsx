'use client'

import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect } from 'react'

export default function LoadingScreen() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && pathname !== '/') {
      router.push('/')
    }
  }, [loading, user, pathname, router])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center" style={{ background: 'var(--discord-darkest)' }}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="loading-orb loading-orb-1" />
        <div className="loading-orb loading-orb-2" />
        <div className="loading-grid" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-discord-blurple/20 border border-discord-blurple/30 flex items-center justify-center shadow-2xl shadow-discord-blurple/20"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
            <Image
              src="/logo.png"
              alt="LunaVerse"
              width={72}
              height={72}
              className="w-[72px] h-[72px] object-contain drop-shadow-xl"
            />
            {/* Fallback moon emoji */}
            <span className="text-4xl hidden">🌙</span>
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-3xl"
            style={{ border: '2px solid transparent', borderTopColor: '#5865F2', animation: 'spin 1.2s linear infinite', borderRadius: '24px' }} />
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">LunaVerse</h1>
          <p className="text-discord-muted text-sm font-medium mt-1">ENT Scolaire RP</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-discord-blurple"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
