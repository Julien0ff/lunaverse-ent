'use client'

import { ShieldAlert, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'

export default function UnauthorizedPage() {
  const { signOut, user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Background aesthetics */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-discord-error/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full glass-card border-discord-error/20 relative z-10 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center bg-discord-error/10 border border-discord-error/20 shadow-lg shadow-discord-error/10">
          <ShieldAlert className="w-10 h-10 text-discord-error" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-white mb-2">Accès Refusé</h1>
          <p className="text-discord-muted">
            Votre compte Discord n&apos;a aucun rôle autorisé pour accéder à l&apos;ENT LunaVerse.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-center font-medium">
          <p className="mb-2">
            Connecté en tant que <br/>
            <span className="font-bold text-white">{user?.user_metadata?.custom_claims?.global_name || user?.user_metadata?.full_name || user?.email || 'Inconnu'}</span>
          </p>
          <p className="text-xs text-discord-muted">
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter l&apos;administration sur le serveur Discord pour obtenir un rôle.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="btn w-full py-4 text-base font-bold bg-discord-error hover:bg-red-600 text-white flex justify-center items-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
