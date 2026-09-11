'use client'

import { useState, useEffect } from 'react'
import { CalendarX2, CheckCircle2, XCircle, Loader2, Search, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

interface Absence {
  id: string
  user_id: string
  reason: string
  duration: string
  attachments: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  profile?: {
    username: string
    nickname_rp: string
    avatar_url: string
  }
}

export default function AdminAbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAbsences()
  }, [])

  const fetchAbsences = async () => {
    try {
      const res = await fetch('/api/absences')
      if (res.ok) {
        const data = await res.json()
        setAbsences(data.items || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, status: 'accepted' | 'rejected') => {
    setProcessingId(id)
    try {
      const res = await fetch('/api/absences/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        fetchAbsences()
      } else {
        alert('Erreur lors de la mise à jour.')
      }
    } catch (e) {
      alert('Erreur réseau.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette absence ?')) return
    setProcessingId(id)
    try {
      const res = await fetch('/api/absences/update', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        fetchAbsences()
      } else {
        alert('Erreur lors de la suppression.')
      }
    } catch (e) {
      alert('Erreur réseau.')
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = absences.filter(a => 
    a.profile?.nickname_rp?.toLowerCase().includes(search.toLowerCase()) || 
    a.profile?.username?.toLowerCase().includes(search.toLowerCase()) ||
    a.reason.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <CalendarX2 className="text-discord-blurple w-8 h-8" />
            Gestion des Absences
          </h2>
          <p className="text-discord-muted mt-2">Validez ou refusez les billets d'absences soumis par les citoyens.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-muted" />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="glass-input pl-10 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.length > 0 ? filtered.map(absence => (
            <div key={absence.id} className={clsx(
              "glass-card p-5 border-l-4 transition-colors",
              absence.status === 'accepted' ? "border-discord-success" : 
              absence.status === 'rejected' ? "border-discord-error" : "border-yellow-500"
            )}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  {absence.profile?.avatar_url ? (
                    <Image src={absence.profile.avatar_url} alt="avatar" width={48} height={48} className="rounded-full shadow-lg" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-discord-blurple flex items-center justify-center font-bold text-white shadow-lg">
                      {absence.profile?.nickname_rp?.[0] || '?'}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {absence.profile?.nickname_rp || absence.profile?.username || 'Utilisateur inconnu'}
                    </h3>
                    <p className="text-sm text-discord-muted">
                      Durée : <span className="font-bold text-white">{absence.duration}</span>
                    </p>
                  </div>
                </div>

                <div className="flex-1 bg-black/20 p-4 rounded-xl border border-white/5 mx-4 max-w-2xl">
                  <p className="text-sm text-gray-300 italic">"{absence.reason}"</p>
                  {absence.attachments && (
                    <a href={absence.attachments} target="_blank" rel="noreferrer" className="text-discord-blurple text-xs font-bold mt-2 inline-block hover:underline">
                      🔗 Voir le justificatif
                    </a>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-xs text-gray-400 mb-1">
                    {new Date(absence.created_at).toLocaleDateString('fr-FR')} à {new Date(absence.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {absence.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdate(absence.id, 'accepted')} 
                        disabled={processingId === absence.id}
                        className="p-2 bg-discord-success/10 hover:bg-discord-success/20 text-discord-success rounded-xl flex items-center gap-2 font-bold text-sm transition-colors"
                      >
                        {processingId === absence.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Valider
                      </button>
                      <button 
                        onClick={() => handleUpdate(absence.id, 'rejected')} 
                        disabled={processingId === absence.id}
                        className="p-2 bg-discord-error/10 hover:bg-discord-error/20 text-discord-error rounded-xl flex items-center gap-2 font-bold text-sm transition-colors"
                      >
                        {processingId === absence.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Refuser
                      </button>
                    </div>
                  ) : (
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest",
                      absence.status === 'accepted' ? "bg-discord-success text-black" : "bg-discord-error text-white"
                    )}>
                      {absence.status === 'accepted' ? 'Validée' : 'Refusée'}
                    </span>
                  )}
                  
                  {absence.status !== 'pending' && (
                    <button 
                      onClick={() => handleDelete(absence.id)}
                      disabled={processingId === absence.id}
                      className="mt-2 p-1.5 text-discord-error hover:bg-discord-error/20 rounded-lg transition-colors flex items-center justify-center"
                      title="Supprimer l'absence"
                    >
                      {processingId === absence.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center glass-card">
              <p className="text-discord-muted font-medium">Aucune absence trouvée.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
