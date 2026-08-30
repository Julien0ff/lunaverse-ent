'use client'

import { Construction } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export default function MaisonPage() {
  const { t } = useLanguage()

  return (
    <div className="page-container max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
      <div className="glass-card p-12 text-center animate-scaleIn w-full relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-discord-blurple/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-24 h-24 bg-discord-blurple/10 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
          <Construction className="w-12 h-12 text-discord-blurple animate-pulse" />
        </div>
        
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight relative z-10">
          {t('maison_page.maintenance_title') || 'En Maintenance'}
        </h1>
        
        <p className="text-discord-muted text-lg font-medium max-w-md mx-auto relative z-10">
          {t('maison_page.maintenance_desc') || "Le système de maisons est actuellement désactivé. Une refonte complète de la fonctionnalité est en cours de préparation."}
        </p>
      </div>
    </div>
  )
}
