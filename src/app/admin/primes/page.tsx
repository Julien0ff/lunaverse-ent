'use client'

import { Clock, Gift } from 'lucide-react'

export default function AdminPrimesPage() {
  return (
    <div className="space-y-6 animate-fadeIn relative z-10">
      <div>
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-sm flex items-center gap-3">
          <Gift className="w-10 h-10 text-discord-blurple drop-shadow-[0_0_10px_rgba(88,101,242,0.5)]" />
          Gestion des Primes
        </h2>
        <p className="text-discord-muted mt-2 font-medium uppercase tracking-widest text-xs">Module de récompenses</p>
      </div>
      
      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-discord-blurple/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500">
          <Clock className="w-12 h-12 text-gray-500 group-hover:text-discord-blurple transition-colors duration-500" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">Module en développement</h3>
        <p className="text-discord-muted max-w-md mx-auto">
          Cette fonctionnalité est temporairement indisponible pendant la refonte vers la nouvelle interface Premium. Revenez bientôt !
        </p>
      </div>
    </div>
  )
}
