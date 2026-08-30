'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Paperclip } from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'

export default function AdminAbsencesPage() {
  const [absences, setAbsences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'refused' | 'all'>('pending')

  useEffect(() => {
    loadAbsences()
  }, [])

  const loadAbsences = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/absences')
      if (r.ok) {
        const data = await r.json()
        setAbsences(data.items || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (type: 'success'|'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const handleAction = async (id: string, status: 'accepted' | 'refused') => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/absences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        showMsg('success', `Absence ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès.`)
        loadAbsences()
      } else {
        const err = await res.json()
        showMsg('error', err.error || 'Erreur lors de l\'action')
      }
    } catch (e) {
      showMsg('error', 'Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="w-5 h-5" />
      case 'refused': return <XCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  const filtered = filter === 'all' ? absences : absences.filter(a => a.status === filter)

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-white">Gestion des Absences</h2>
        <p className="text-discord-muted">Validez ou refusez les justifications d'absence des joueurs.</p>
      </div>

      {msg && (
        <div className={clsx("p-4 rounded-xl text-sm font-bold flex items-center gap-2", msg.type === 'success' ? "bg-discord-success/10 text-discord-success" : "bg-discord-error/10 text-discord-error")}>
          <AlertCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}

      <div className="flex gap-2">
        {(['pending', 'accepted', 'refused', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
              filter === f 
                ? "bg-white/10 text-white border-white/20" 
                : "bg-transparent text-discord-muted border-transparent hover:bg-white/5 hover:text-white"
            )}
          >
            {f === 'pending' && `En attente (${absences.filter(i => i.status === 'pending').length})`}
            {f === 'accepted' && `Acceptées (${absences.filter(i => i.status === 'accepted').length})`}
            {f === 'refused' && `Refusées (${absences.filter(i => i.status === 'refused').length})`}
            {f === 'all' && 'Toutes'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass-card text-center py-12 text-discord-muted">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune absence trouvée pour ce filtre.</p>
          </div>
        ) : (
          filtered.map(abs => (
            <div key={abs.id} className="glass-card flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden group">
              {abs.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-discord-warning" />}
              {abs.status === 'accepted' && <div className="absolute top-0 left-0 w-1 h-full bg-discord-success" />}
              {abs.status === 'refused' && <div className="absolute top-0 left-0 w-1 h-full bg-discord-error" />}
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                   {abs.profile && (
                     <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                        <div className="w-6 h-6 rounded-full overflow-hidden relative">
                           <Image src={abs.profile.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill alt="" />
                        </div>
                        <span className="text-sm font-black text-discord-blurple uppercase tracking-widest">{abs.profile.nickname_rp || abs.profile.username}</span>
                     </div>
                   )}
                   <span className="text-xs bg-white/5 text-discord-muted px-2 py-1 rounded-full font-mono flex items-center gap-1">
                     <Calendar className="w-3 h-3" /> {new Date(abs.created_at).toLocaleDateString()}
                   </span>
                   <span className="text-xs bg-white/5 text-discord-muted px-2 py-1 rounded-full font-mono flex items-center gap-1">
                     <Clock className="w-3 h-3" /> {abs.duration}
                   </span>
                </div>

                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-2">Motif de l'absence</p>
                  <p className="text-sm text-white">{abs.reason}</p>
                </div>
                
                {abs.attachments && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                    <Paperclip className="w-4 h-4 text-discord-muted" />
                    <p className="text-xs text-discord-muted truncate">{abs.attachments}</p>
                  </div>
                )}
              </div>

              {abs.status === 'pending' && (
                <div className="flex md:flex-col gap-2 shrink-0 md:w-48">
                  <button 
                    onClick={() => handleAction(abs.id, 'accepted')}
                    disabled={actionLoading === abs.id}
                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    {actionLoading === abs.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Accepter
                  </button>
                  <button 
                    onClick={() => handleAction(abs.id, 'refused')}
                    disabled={actionLoading === abs.id}
                    className="btn btn-error flex-1 flex items-center justify-center gap-2"
                  >
                    {actionLoading === abs.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Refuser
                  </button>
                </div>
              )}
              
              {abs.status !== 'pending' && (
                <div className="flex flex-col justify-center items-center shrink-0 md:w-48 bg-white/5 rounded-xl border border-white/5">
                   <p className={clsx(
                     "text-sm font-black uppercase tracking-widest flex items-center gap-2",
                     abs.status === 'accepted' ? "text-discord-success" : "text-discord-error"
                   )}>
                     {getStatusIcon(abs.status)}
                     {abs.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                   </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
