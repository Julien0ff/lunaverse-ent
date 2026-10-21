'use client'

import { useState, useEffect } from 'react'
import { CalendarX2, CheckCircle2, XCircle, Loader2, Search, Trash2, Shield, UserCheck } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

interface ReviewerProfile {
  id?: string
  username: string
  nickname_rp?: string
  avatar_url?: string
}

interface Absence {
  id: string
  user_id: string
  reason: string
  duration: string
  attachments: string
  status: 'pending' | 'accepted' | 'rejected' | 'refused'
  created_at: string
  processed_at?: string | null
  processed_by?: string | null
  profile?: {
    username: string
    nickname_rp: string
    avatar_url: string
  }
  reviewer?: ReviewerProfile | null
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

  const handleClaim = async (id: string, currentStatus: string) => {
    setProcessingId(id)
    try {
      const normalizedStatus = (currentStatus === 'refused' || currentStatus === 'rejected') ? 'rejected' : 'accepted'
      const res = await fetch('/api/absences/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: normalizedStatus })
      })
      if (res.ok) {
        fetchAbsences()
      } else {
        alert("Erreur lors de l'attribution.")
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
    a.reason.toLowerCase().includes(search.toLowerCase()) ||
    a.reviewer?.nickname_rp?.toLowerCase().includes(search.toLowerCase()) ||
    a.reviewer?.username?.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Rechercher élève, motif, ou réviseur..."
            className="glass-input pl-10 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.length > 0 ? filtered.map(absence => {
            const isAccepted = absence.status === 'accepted'
            const isRejected = absence.status === 'rejected' || absence.status === 'refused'
            const reviewerName = absence.reviewer?.nickname_rp || absence.reviewer?.username

            return (
              <div key={absence.id} className={clsx(
                "glass-card p-5 border-l-4 transition-colors",
                isAccepted ? "border-discord-success" : 
                isRejected ? "border-discord-error" : "border-yellow-500"
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
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm",
                            isAccepted ? "bg-discord-success text-black" : "bg-discord-error text-white"
                          )}>
                            {isAccepted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {isAccepted ? 'Validée' : 'Refusée'}
                          </span>

                          <button 
                            onClick={() => handleDelete(absence.id)}
                            disabled={processingId === absence.id}
                            className="p-1.5 text-discord-error hover:bg-discord-error/20 rounded-lg transition-colors flex items-center justify-center"
                            title="Supprimer l'absence"
                          >
                            {processingId === absence.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Auteur du traitement (Reviewer) */}
                        <div className="flex items-center gap-2 mt-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                          {absence.reviewer?.avatar_url ? (
                            <Image
                              src={absence.reviewer.avatar_url}
                              alt={reviewerName || 'Auteur'}
                              width={20}
                              height={20}
                              className="rounded-full flex-shrink-0 ring-1 ring-white/10"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-discord-blurple/20 flex items-center justify-center flex-shrink-0">
                              <Shield className="w-3 h-3 text-discord-blurple" />
                            </div>
                          )}
                          <span className="text-gray-300">
                            {isAccepted ? 'Validée par' : 'Refusée par'} :{' '}
                            <strong className="text-white font-semibold">
                              {reviewerName || "L'administration"}
                            </strong>
                          </span>

                          {/* Permet de s'attribuer une absence passée sans auteur enregistré */}
                          {!absence.reviewer && (
                            <button
                              onClick={() => handleClaim(absence.id, absence.status)}
                              disabled={processingId === absence.id}
                              className="ml-1 text-[11px] text-discord-blurple hover:text-white font-bold flex items-center gap-1 hover:underline transition-colors"
                              title="Signer cette absence passée à mon nom"
                            >
                              <UserCheck className="w-3 h-3" />
                              M'attribuer
                            </button>
                          )}
                        </div>

                        {absence.processed_at && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            le {new Date(absence.processed_at).toLocaleDateString('fr-FR')} à {new Date(absence.processed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          }) : (
            <div className="p-12 text-center glass-card">
              <p className="text-discord-muted font-medium">Aucune absence trouvée.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
