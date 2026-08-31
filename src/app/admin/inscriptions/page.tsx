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
  options: string[]
  status: 'pending' | 'accepted' | 'refused'
  created_at: string
}

export default function AdminInscriptionsPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'refused' | 'all'>('pending')
  
  const [salonAdmin, setSalonAdmin] = useState('')
  const [salonReponses, setSalonReponses] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [deploying, setDeploying] = useState(false)
  
  // Modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [selectedInscriptionId, setSelectedInscriptionId] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rIns, rClass, rSettings] = await Promise.all([
        fetch('/api/admin/inscriptions'),
        fetch('/api/admin/classes'),
        fetch('/api/admin/inscriptions/settings')
      ])
      if (rIns.ok) {
        const data = await rIns.json()
        setInscriptions(data.items || [])
      }
      if (rClass.ok) {
        const data = await rClass.json()
        setClasses(data.classes || [])
      }
      if (rSettings.ok) {
        const data = await rSettings.json()
        setSalonAdmin(data.salon_admin || '')
        setSalonReponses(data.salon_reponses || '')
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

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/inscriptions/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salon_admin: salonAdmin, salon_reponses: salonReponses })
      })
      if (res.ok) {
        showMsg('success', 'Paramètres Discord sauvegardés.')
      } else {
        showMsg('error', 'Erreur lors de la sauvegarde des paramètres.')
      }
    } catch (e) {
      showMsg('error', 'Erreur de connexion.')
    } finally {
      setSavingSettings(false)
    }
  }

  const deployEmbed = async () => {
    setDeploying(true)
    try {
      const res = await fetch('/api/admin/inscriptions/deploy', { method: 'POST' })
      if (res.ok) {
        showMsg('success', 'Embed déployé sur Discord !')
      } else {
        const err = await res.json()
        showMsg('error', err.error || 'Erreur lors du déploiement.')
      }
    } catch (e) {
      showMsg('error', 'Erreur de connexion.')
    } finally {
      setDeploying(false)
    }
  }

  const handleAction = async (id: string, status: 'accepted' | 'refused', classe?: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/inscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, classe })
      })
      if (res.ok) {
        showMsg('success', `Inscription ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès.`)
        loadData()
      } else {
        const err = await res.json()
        showMsg('error', err.error || 'Erreur lors de l\'action')
      }
    } catch (e) {
      showMsg('error', 'Erreur de connexion')
    } finally {
      setActionLoading(null)
      setAcceptModalOpen(false)
      setSelectedInscriptionId(null)
      setSelectedClass('')
    }
  }

  const openAcceptModal = (id: string) => {
    setSelectedInscriptionId(id)
    setAcceptModalOpen(true)
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

      {/* Settings Section */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Paramètres Discord</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Salon Candidatures</label>
            <input
              type="text"
              value={salonAdmin}
              onChange={e => setSalonAdmin(e.target.value)}
              placeholder="ID du salon Discord"
              className="glass-input w-full bg-white/5 border-white/10 text-white focus:border-discord-blurple"
            />
            <p className="text-[10px] text-discord-muted">Où s'envoie l'embed pour s'inscrire.</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Salon Réponses</label>
            <input
              type="text"
              value={salonReponses}
              onChange={e => setSalonReponses(e.target.value)}
              placeholder="ID du salon Discord"
              className="glass-input w-full bg-white/5 border-white/10 text-white focus:border-discord-blurple"
            />
            <p className="text-[10px] text-discord-muted">Où arrivent les demandes remplies par les joueurs.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="btn bg-white/10 hover:bg-white/20 text-white px-6 py-2 font-bold rounded-xl transition-all"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sauvegarder les salons'}
          </button>
          <button
            onClick={deployEmbed}
            disabled={deploying}
            className="btn bg-[#5865F2] hover:bg-[#5865F2]/80 text-white px-6 py-2 font-bold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(88,101,242,0.3)]"
          >
            {deploying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Déployer sur Discord'}
          </button>
        </div>
      </div>

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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Date Naissance</p>
                    <p className="text-sm text-white font-medium">{i.dob}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Spécialité</p>
                    <p className="text-sm text-white font-medium">
                      {i.options?.length ? i.options.join(', ') : 'Aucune'}
                    </p>
                  </div>
                </div>
                
                <p className="text-[10px] text-discord-muted flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> Soumis le {new Date(i.created_at).toLocaleString('fr-FR')}
                </p>
              </div>

              {i.status === 'pending' && (
                <div className="flex md:flex-col gap-2 shrink-0 md:w-48">
                  <button 
                    onClick={() => openAcceptModal(i.id)}
                    disabled={actionLoading === i.id}
                    className="btn bg-[#57F287] hover:bg-[#57F287]/80 text-black flex-1 flex items-center justify-center gap-2 font-bold"
                  >
                    {actionLoading === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Accepter
                  </button>
                  <button 
                    onClick={() => handleAction(i.id, 'refused')}
                    disabled={actionLoading === i.id}
                    className="btn bg-[#ED4245] hover:bg-[#ED4245]/80 text-white flex-1 flex items-center justify-center gap-2 font-bold"
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

      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1e1e24] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-black text-white">Validation de l'inscription</h3>
              <p className="text-sm text-discord-muted mt-1">Choisissez la classe dans laquelle ajouter l'élève.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Classe de l'élève</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-discord-blurple"
                >
                  <option value="" disabled>-- Sélectionner une classe --</option>
                  {classes.map((c: any) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 bg-black/20 flex justify-end gap-3">
              <button
                onClick={() => setAcceptModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-discord-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => selectedInscriptionId && handleAction(selectedInscriptionId, 'accepted', selectedClass)}
                disabled={!selectedClass}
                className="px-5 py-2.5 rounded-xl font-bold bg-discord-success hover:bg-discord-success/80 text-white transition-colors disabled:opacity-50"
              >
                Confirmer l'ajout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
