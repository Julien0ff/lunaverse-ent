'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Moon, ArrowRight, Shield, Wallet, Globe, Gamepad2, ShoppingCart, User, Star, Zap } from 'lucide-react'

const DiscordIcon = () => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" className="w-6 h-6">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.1a105.73,105.73,0,0,0,32.22,16.15,77.7,77.7,0,0,0,6.89-11.11,68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.24-16.14C129.38,52.28,124.81,28.53,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
)

const features = [
  { icon: Wallet, title: 'Banque RP', description: 'Gérez votre argent virtuel, faites des virements et touchez votre salaire chaque semaine.', color: '#5865F2', delay: '0ms' },
  { icon: Globe, title: 'Réseau Social', description: 'Publiez, commentez et likez comme sur un vrai réseau social. Connectez-vous à la communauté.', color: '#57F287', delay: '100ms' },
  { icon: Gamepad2, title: 'Casino', description: 'Machines à sous, dés, pièce… Tentez votre chance et multipliez vos gains.', color: '#FEE75C', delay: '200ms' },
  { icon: ShoppingCart, title: 'Boutique', description: 'Achetez des snacks, boissons et objets exclusifs avec vos euros LunaVerse.', color: '#ED4245', delay: '300ms' },
  { icon: User, title: 'Profil', description: 'Consultez vos statistiques, vos rôles RP et votre historique d\'activité.', color: '#EB459E', delay: '400ms' },
  { icon: Shield, title: 'Administration', description: 'Panneau de gestion avancé réservé aux administrateurs du serveur.', color: '#99AAB5', delay: '500ms' },
]

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleSignIn = async () => {
    setIsSigningIn(true)
    await signIn()
  }

  if (loading) {
    return (
      <div className="login-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-discord-blurple rounded-3xl flex items-center justify-center shadow-2xl shadow-discord-blurple/40 animate-pulse-glow">
            <Moon className="w-12 h-12 text-white" />
          </div>
          <div className="flex items-center gap-2 text-discord-muted">
            <div className="w-1.5 h-1.5 bg-discord-blurple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-discord-blurple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-discord-blurple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />
      <div className="login-bg-grid" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          {/* Badge */}
          <div className="login-badge animate-fadeIn">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>ENT Officiel du Serveur LunaVerse</span>
          </div>

          {/* Logo */}
          <div className="login-logo animate-fadeIn" style={{ animationDelay: '100ms' }}>
            <div className="login-logo-icon">
              <Image
                src="/logo.png"
                alt="LunaVerse"
                width={80}
                height={80}
                className="w-20 h-20 object-contain drop-shadow-2xl"
              />
              <Moon className="w-14 h-14 text-white hidden" />
            </div>
            <div className="login-logo-ring" />
          </div>

          {/* Title */}
          <h1 className="login-title animate-fadeIn" style={{ animationDelay: '200ms' }}>
            ENT <span className="login-title-accent">LunaVerse</span>
          </h1>
          <p className="login-subtitle animate-fadeIn" style={{ animationDelay: '300ms' }}>
            L&apos;espace numérique du serveur RP Discord LunaVerse. Banque, casino, boutique et réseau social — tout en un seul endroit.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 animate-fadeIn" style={{ animationDelay: '400ms' }}>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="login-cta-btn group"
              id="discord-login-btn"
            >
              {isSigningIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <DiscordIcon />
                  Se connecter avec Discord
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>
            <p className="text-discord-muted text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Réservé aux membres avec un rôle RP autorisé
            </p>
          </div>

          {/* Stats bar */}
          <div className="login-stats animate-fadeIn" style={{ animationDelay: '500ms' }}>
            <div className="login-stat">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Instantané</span>
            </div>
            <div className="login-stat-divider" />
            <div className="login-stat">
              <Shield className="w-4 h-4 text-discord-success" />
              <span>100% Sécurisé</span>
            </div>
            <div className="login-stat-divider" />
            <div className="login-stat">
              <Globe className="w-4 h-4 text-discord-blurple" />
              <span>Serveur LunaVerse</span>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="px-6 pb-20 max-w-6xl mx-auto w-full">
          <h2 className="text-center text-xs font-black text-discord-muted uppercase tracking-[0.3em] mb-10 animate-fadeIn">
            Toutes les fonctionnalités
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="login-feature-card animate-fadeIn"
                  style={{ animationDelay: feature.delay }}
                >
                  <div
                    className="login-feature-icon"
                    style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}25` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">{feature.title}</h3>
                  <p className="text-discord-muted text-sm leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 text-center text-discord-muted text-sm">
          <p>© {new Date().getFullYear()} LunaVerse ENT — Serveur RP Discord</p>
        </footer>
      </div>
    </div>
  )
}
