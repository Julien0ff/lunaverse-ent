'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2, AlertCircle, Clock } from 'lucide-react'
import clsx from 'clsx'

interface Inscription {
  id: string
  discord_id: string
  prenom: string
  nom: string
  dob: string
  description: string
  classe: string
  langue: string
  options: string[]
  status: 'pending' | 'accepted' | 'refused'
  created_at: string
}

export default function AdminInscriptionsPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'refused' | 'all'>('pending')

  useEffect(() => {
    loadInscriptions()
  }, [])

  const loadInscriptions = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/inscriptions')
      if (r.ok) {
        const data = await r.json()
        setInscriptions(data.items || [])
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
      const res = await fetch('/api/admin/inscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        showMsg('success', `Inscription ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès.`)
        loadInscriptions()
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

  const filtered = filter === 'all' ? inscriptions : inscriptions.filter(i => i.status === filter)

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-white">Inscriptions RP</h2>
        <p className="text-discord-muted">Gérez les demandes d'inscription au serveur RP depuis Discord.</p>
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
            {f === 'pending' && `En attente (${inscriptions.filter(i => i.status === 'pending').length})`}
            {f === 'accepted' && `Acceptées (${inscriptions.filter(i => i.status === 'accepted').length})`}
            {f === 'refused' && `Refusées (${inscriptions.filter(i => i.status === 'refused').length})`}
            {f === 'all' && 'Toutes'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass-card text-center py-12 text-discord-muted">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune inscription trouvée pour ce filtre.</p>
          </div>
        ) : (
          filtered.map(i => (
            <div key={i.id} className="glass-card flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden group">
              {i.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-discord-warning" />}
              {i.status === 'accepted' && <div className="absolute top-0 left-0 w-1 h-full bg-discord-success" />}
              {i.status === 'refused' && <div className="absolute top-0 left-0 w-1 h-full bg-discord-error" />}
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-white">{i.prenom} {i.nom.toUpperCase()}</h3>
                  <span className="text-xs bg-white/5 text-discord-muted px-2 py-1 rounded-full font-mono">{i.discord_id}</span>
                  <span className={clsx(
                    "text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-lg",
                    i.classe === 'NOV' ? "bg-discord-blurple/20 text-discord-blurple" : "bg-discord-error/20 text-discord-error"
                  )}>
                    {i.classe === 'NOV' ? 'Nova' : 'Nébuleuse'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Date Naissance</p>
                    <p className="text-sm text-white font-medium">{i.dob}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">LV2</p>
                    <p className="text-sm text-white font-medium">{i.langue || 'Aucune'}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl col-span-2">
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Options/Clubs</p>
                    <p className="text-sm text-white font-medium">
                      {i.options?.length ? i.options.join(', ') : 'Aucun'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl text-sm text-discord-muted italic">
                  "{i.description}"
                </div>
                
                <p className="text-[10px] text-discord-muted flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> Soumis le {new Date(i.created_at).toLocaleString('fr-FR')}
                </p>
              </div>

              {i.status === 'pending' && (
                <div className="flex md:flex-col gap-2 shrink-0 md:w-48">
                  <button 
                    onClick={() => handleAction(i.id, 'accepted')}
                    disabled={actionLoading === i.id}
                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    {actionLoading === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Accepter
                  </button>
                  <button 
                    onClick={() => handleAction(i.id, 'refused')}
                    disabled={actionLoading === i.id}
                    className="btn btn-error flex-1 flex items-center justify-center gap-2"
                  >
                    {actionLoading === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Refuser
                  </button>
                  <p className="text-[10px] text-discord-muted text-center mt-2 hidden md:block">
                    Le joueur recevra une notification automatique sur Discord.
                  </p>
                </div>
              )}
              
              {i.status !== 'pending' && (
                <div className="flex flex-col justify-center items-center shrink-0 md:w-48 bg-white/5 rounded-xl border border-white/5">
                   <p className={clsx(
                     "text-sm font-black uppercase tracking-widest flex items-center gap-2",
                     i.status === 'accepted' ? "text-discord-success" : "text-discord-error"
                   )}>
                     {i.status === 'accepted' ? <><Check className="w-5 h-5"/> Acceptée</> : <><X className="w-5 h-5"/> Refusée</>}
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
