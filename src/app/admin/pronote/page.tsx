'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BookOpen, Check, X, Loader2, Download, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface Request {
  id: string
  image_url: string
  status: string
  created_at: string
  profile: { id: string; username: string; discord_id: string; nickname_rp?: string }
}

export default function AdminPronotePage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [pronoteIdInputs, setPronoteIdInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/admin/pronote')
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const updateRequest = async (requestId: string, status: string, profileId?: string) => {
    const pronoteId = pronoteIdInputs[requestId]
    if (status === 'approved' && !pronoteId) {
      alert("Veuillez saisir l'identifiant Pronote avant d'approuver.")
      return
    }

    try {
      const res = await fetch('/api/admin/pronote', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status, profileId, pronoteId })
      })
      if (res.ok) {
        setRequests(requests.map(r => r.id === requestId ? { ...r, status } : r))
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const otherRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <BookOpen className="text-discord-blurple w-8 h-8" />
          Demandes Pronote
        </h2>
        <p className="text-discord-muted">Vérifiez les captures Pronote et liez les comptes des élèves.</p>
      </div>

      {pendingRequests.length === 0 && otherRequests.length === 0 ? (
        <div className="p-8 text-center text-discord-muted bg-white/5 rounded-3xl border border-white/5">
          Aucune demande pour le moment.
        </div>
      ) : (
        <div className="space-y-6">
          {pendingRequests.map(req => (
            <div key={req.id} className="glass-card p-6 border-l-4 border-l-amber-500">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{req.profile.username}</h3>
                      <p className="text-sm text-discord-muted">{req.profile.nickname_rp || 'Pas de pseudo RP'}</p>
                      <span className="text-[10px] font-mono text-discord-muted block mt-1">Discord: {req.profile.discord_id}</span>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs font-bold rounded-full uppercase tracking-wider">
                      En attente
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-discord-muted uppercase tracking-wider">Identifiant Pronote (OBLIGATOIRE)</label>
                    <input
                      type="text"
                      className="glass-input w-full bg-white/5 border-white/10 text-white focus:border-discord-blurple"
                      placeholder="Ex: dupont.jean"
                      value={pronoteIdInputs[req.id] || ''}
                      onChange={e => setPronoteIdInputs({ ...pronoteIdInputs, [req.id]: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => updateRequest(req.id, 'approved', req.profile.id)}
                      className="flex-1 btn bg-discord-success hover:bg-discord-success/80 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Approuver
                    </button>
                    <button
                      onClick={() => updateRequest(req.id, 'rejected')}
                      className="flex-1 btn bg-discord-error hover:bg-discord-error/80 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2"
                    >
                      <X size={18} /> Refuser
                    </button>
                  </div>
                </div>

                <div className="w-full md:w-64 h-64 bg-white/5 rounded-xl border border-white/10 overflow-hidden relative group shrink-0">
                  <Image src={req.image_url} alt="Preuve Pronote" fill className="object-cover" />
                  <a
                    href={req.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="bg-white/10 p-3 rounded-full text-white backdrop-blur-md">
                      <Download size={24} />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          ))}

          {otherRequests.length > 0 && (
            <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Check className="text-discord-success w-5 h-5" />
                Demandes Traitées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{req.profile.username}</p>
                      <span className={clsx(
                        "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block",
                        req.status === 'approved' ? "bg-discord-success/20 text-discord-success" : "bg-discord-error/20 text-discord-error"
                      )}>
                        {req.status === 'approved' ? 'Approuvé' : 'Refusé'}
                      </span>
                    </div>
                    <a href={req.image_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-discord-muted hover:text-white transition-colors">
                      <Download size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
