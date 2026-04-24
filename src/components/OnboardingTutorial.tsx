'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  Sparkles, BookOpen, MessageSquare, Users, Gamepad2,
  ShoppingCart, ChevronRight, ChevronLeft, X, Rocket,
  Shield, Heart, Utensils, Star
} from 'lucide-react'

interface OnboardingStep {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  features?: { icon: React.ReactNode; label: string }[]
  gradient: string
  accentColor: string
}

const STEPS: OnboardingStep[] = [
  {
    icon: <Sparkles className="w-10 h-10" />,
    title: 'Bienvenue sur LunaVerse',
    subtitle: 'Votre ENT nouvelle génération',
    description: 'LunaVerse est un Environnement Numérique de Travail immersif et ludique, conçu pour transformer votre expérience scolaire en une aventure unique. Connectez-vous, échangez et progressez dans un univers RP intégré.',
    gradient: 'linear-gradient(135deg, #5865F2, #7C8EFF)',
    accentColor: '#5865F2',
  },
  {
    icon: <BookOpen className="w-10 h-10" />,
    title: 'Le Projet LunaVerse',
    subtitle: 'Plus qu\'un ENT — un écosystème vivant',
    description: 'LunaVerse combine la gestion scolaire avec des mécaniques RP innovantes. Chaque utilisateur possède un profil unique avec des statistiques de survie, un système économique complet et un réseau social intégré.',
    features: [
      { icon: <Shield className="w-4 h-4" />, label: 'Profil RP avec stats de survie' },
      { icon: <Star className="w-4 h-4" />, label: 'Système de rôles & classes' },
      { icon: <Heart className="w-4 h-4" />, label: 'Système de relations sociales' },
    ],
    gradient: 'linear-gradient(135deg, #EB459E, #FF7EB3)',
    accentColor: '#EB459E',
  },
  {
    icon: <Gamepad2 className="w-10 h-10" />,
    title: 'Fonctionnalités de l\'ENT',
    subtitle: 'Tout ce dont vous avez besoin',
    description: 'Explorez toutes les fonctionnalités disponibles : gérez vos finances, achetez dans la boutique, jouez au casino, consultez le menu de la cantine et interagissez avec la communauté.',
    features: [
      { icon: <ShoppingCart className="w-4 h-4" />, label: 'Boutique & Économie RP' },
      { icon: <Utensils className="w-4 h-4" />, label: 'Cantine avec menus du week-end' },
      { icon: <Gamepad2 className="w-4 h-4" />, label: 'Casino : Slots, Dés, Pile ou Face' },
      { icon: <Users className="w-4 h-4" />, label: 'Réseau social & Messagerie' },
    ],
    gradient: 'linear-gradient(135deg, #57F287, #43B581)',
    accentColor: '#57F287',
  },
  {
    icon: <MessageSquare className="w-10 h-10" />,
    title: 'Discord & Synchronisation',
    subtitle: 'Tout est connecté en temps réel',
    description: 'Votre profil est synchronisé avec le serveur Discord de LunaVerse. Recevez des notifications en DM, utilisez les commandes slash, et retrouvez votre activité sur les deux plateformes.',
    features: [
      { icon: <MessageSquare className="w-4 h-4" />, label: 'Commandes slash Discord intégrées' },
      { icon: <Shield className="w-4 h-4" />, label: 'Rôles synchronisés automatiquement' },
      { icon: <Star className="w-4 h-4" />, label: 'Notifications temps réel en DM' },
    ],
    gradient: 'linear-gradient(135deg, #FEE75C, #F0B132)',
    accentColor: '#FEE75C',
  },
  {
    icon: <Rocket className="w-10 h-10" />,
    title: 'C\'est parti !',
    subtitle: 'Votre aventure commence maintenant',
    description: 'Vous êtes prêt à explorer LunaVerse. Consultez votre tableau de bord, personnalisez votre profil et commencez à interagir avec la communauté. Bonne aventure !',
    gradient: 'linear-gradient(135deg, #5865F2, #57F287)',
    accentColor: '#5865F2',
  },
]

export default function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const [slideKey, setSlideKey] = useState(0)
  const { refreshProfile } = useAuth()

  useEffect(() => {
    // Fade in on mount
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleComplete = useCallback(async () => {
    setIsExiting(true)
    try {
      await fetch('/api/auth/onboarding-complete', { method: 'POST' })
      await refreshProfile()
    } catch (e) {
      console.error('Onboarding complete error:', e)
    }
    // Let the exit animation play
    setTimeout(() => onComplete(), 400)
  }, [onComplete, refreshProfile])

  const goNext = () => {
    if (step === STEPS.length - 1) {
      handleComplete()
      return
    }
    setSlideDir('right')
    setSlideKey(k => k + 1)
    setStep(s => s + 1)
  }

  const goPrev = () => {
    if (step === 0) return
    setSlideDir('left')
    setSlideKey(k => k + 1)
    setStep(s => s - 1)
  }

  const current = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div
      className="onboarding-overlay"
      style={{
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Background effects */}
      <div className="onboarding-bg-grid" />
      <div
        className="onboarding-bg-orb onboarding-bg-orb-1"
        style={{ background: `radial-gradient(circle, ${current.accentColor}30 0%, transparent 70%)` }}
      />
      <div
        className="onboarding-bg-orb onboarding-bg-orb-2"
        style={{ background: `radial-gradient(circle, ${current.accentColor}15 0%, transparent 70%)` }}
      />

      {/* Skip button */}
      <button
        onClick={handleComplete}
        className="onboarding-skip"
        title="Passer le tutoriel"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main card */}
      <div
        className="onboarding-card"
        style={{
          transform: isVisible && !isExiting ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(20px)',
          opacity: isVisible && !isExiting ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Progress bar */}
        <div className="onboarding-progress-track">
          <div
            className="onboarding-progress-fill"
            style={{
              width: `${progress}%`,
              background: current.gradient,
            }}
          />
        </div>

        {/* Step indicators */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlideDir(i > step ? 'right' : 'left'); setSlideKey(k => k + 1); setStep(i) }}
              className="onboarding-dot"
              style={{
                background: i === step ? current.accentColor : 'rgba(255,255,255,0.15)',
                width: i === step ? '28px' : '8px',
                boxShadow: i === step ? `0 0 12px ${current.accentColor}60` : 'none',
              }}
            />
          ))}
        </div>

        {/* Content — animated slide */}
        <div
          key={slideKey}
          className="onboarding-content"
          style={{
            animation: `onboarding-slide-${slideDir} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
          }}
        >
          {/* Icon */}
          <div
            className="onboarding-icon"
            style={{ background: current.gradient }}
          >
            {current.icon}
          </div>

          {/* Title */}
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-subtitle" style={{ color: current.accentColor }}>
            {current.subtitle}
          </p>

          {/* Description */}
          <p className="onboarding-desc">{current.description}</p>

          {/* Features list */}
          {current.features && (
            <div className="onboarding-features">
              {current.features.map((f, i) => (
                <div
                  key={i}
                  className="onboarding-feature"
                  style={{
                    animationDelay: `${0.15 + i * 0.08}s`,
                    borderColor: `${current.accentColor}20`,
                  }}
                >
                  <span
                    className="onboarding-feature-icon"
                    style={{ color: current.accentColor }}
                  >
                    {f.icon}
                  </span>
                  <span className="onboarding-feature-label">{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          <button
            onClick={goPrev}
            disabled={step === 0}
            className="onboarding-nav-btn onboarding-nav-prev"
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </button>

          <span className="onboarding-step-count">
            {step + 1} / {STEPS.length}
          </span>

          <button
            onClick={goNext}
            className="onboarding-nav-btn onboarding-nav-next"
            style={{
              background: step === STEPS.length - 1 ? current.gradient : undefined,
              color: step === STEPS.length - 1 ? 'white' : undefined,
              boxShadow: step === STEPS.length - 1 ? `0 4px 20px ${current.accentColor}40` : undefined,
            }}
          >
            {step === STEPS.length - 1 ? 'Commencer' : 'Suivant'}
            {step === STEPS.length - 1 ? <Rocket className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
