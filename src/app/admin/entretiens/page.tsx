'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Plus, Users, Search, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

export default function EntretiensListPage() {
  const { t } = useLanguage()
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/admin/interviews')
      if (res.ok) {
        const data = await res.json()
        setInterviews(data.interviews || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterviews()
  }, [])

  const handleCreate = async () => {
    // We could open a modal here, but for now let's just create a draft and redirect to it
    try {
      const res = await fetch('/api/admin/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_discord_id: 'À définir',
          rp_firstname: 'Prénom',
          rp_lastname: 'Nom',
          target_role: 'Professeur' // default
        })
      })
      if (res.ok) {
        const data = await res.json()
        window.location.href = `/admin/entretiens/${data.interview.id}`
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-discord-success bg-discord-success/10 border-discord-success/30'
      case 'refused': return 'text-discord-error bg-discord-error/10 border-discord-error/30'
      case 'pending': return 'text-discord-warning bg-discord-warning/10 border-discord-warning/30'
      default: return 'text-discord-muted bg-white/5 border-white/10'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepté'
      case 'refused': return 'Refusé'
      case 'pending': return 'En attente'
      default: return 'Brouillon'
    }
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8 animate-slideIn">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10 text-discord-blurple drop-shadow-md" />
            Entretiens de Recrutement
          </h1>
          <p className="text-discord-muted mt-2 font-medium">Gérez les entretiens des professeurs, AED, et autres postes.</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary px-6 shadow-lg shadow-discord-blurple/20 hover:-translate-y-1">
          <Plus className="w-5 h-5" />
          Nouvel Entretien
        </button>
      </div>

      <div className="glass-card p-2 animate-fadeIn border border-white/5 shadow-2xl">
        {loading ? (
          <div className="p-8 text-center text-discord-muted animate-pulse font-bold">Chargement...</div>
        ) : interviews.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <p className="text-white font-bold text-lg">Aucun entretien trouvé</p>
            <p className="text-discord-muted text-sm mt-1">Créez le premier entretien pour commencer le recrutement.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {interviews.map(inv => (
              <Link 
                key={inv.id} 
                href={`/admin/entretiens/${inv.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-discord-blurple/30 transition-all group"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-white">{inv.rp_firstname} {inv.rp_lastname}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 font-bold uppercase tracking-wider text-discord-muted">
                      {inv.target_role}
                    </span>
                    <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest", getStatusColor(inv.status))}>
                      {getStatusLabel(inv.status)}
                    </span>
                  </div>
                  <div className="text-xs text-discord-muted flex items-center gap-2">
                    <span>Créé le {new Date(inv.created_at).toLocaleDateString()}</span>
                    •
                    <span>Note Globale : {inv.global_note ? `${inv.global_note}/20` : '—'}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-discord-blurple group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
