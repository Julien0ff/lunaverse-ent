'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Wallet, ArrowUpRight, ArrowDownRight, Gift, Clock, Search, Send, Briefcase, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'

interface Transaction {
  id: string
  from_user_id: string | null
  to_user_id: string | null
  amount: number
  type: string
  description: string
  created: string
}

export default function Bank() {
  const { profile, roles, user, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'daily' | 'declarations'>('send')
  const [recipient, setRecipient] = useState('')
  const [recipientSuggestions, setRecipientSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pendingBonuses, setPendingBonuses] = useState<any[]>([])
  const [declarations, setDeclarations] = useState<any[]>([])
  const [dirtySources, setDirtySources] = useState<any[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>('')
  
  // Declaration Form state
  const [decReason, setDecReason] = useState('')

  const loadTransactions = useCallback(async () => {
    if (!profile?.id) return
    try {
      const response = await fetch('/api/bank/transactions')
      const data = await response.json()
      if (data.items) {
        setTransactions(data.items as Transaction[])
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }, [profile?.id])

  const loadPendingBonuses = useCallback(async () => {
    if (!profile?.id) return
    try {
      const res = await fetch('/api/taxes')
      const data = await res.json()
      if (data.items) {
        setPendingBonuses(data.items.filter((i: any) => Number(i.amount) < 0))
      }
    } catch (err) {
      console.error('Error loading rewards:', err)
    }
  }, [profile?.id])

  const loadDeclarations = useCallback(async () => {
    if (!profile?.id) return
    try {
      const res = await fetch('/api/admin/declarations')
      const data = await res.json()
      if (data.declarations) {
        setDeclarations(data.declarations.filter((d: any) => d.user_id === profile.id))
      }
    } catch (err) {
      console.error('Error loading declarations:', err)
    }
  }, [profile?.id])

  const loadDirtySources = useCallback(async () => {
    if (!profile?.id) return
    try {
      const res = await fetch('/api/bank/dirty-sources')
      const data = await res.json()
      if (data.sources) {
        setDirtySources(data.sources)
      }
    } catch (err) {
      console.error('Error loading sources:', err)
    }
  }, [profile?.id])

  useEffect(() => {
    if (profile?.id) {
      loadTransactions()
      loadPendingBonuses()
      loadDeclarations()
      loadDirtySources()
    }
  }, [profile?.id, loadTransactions, loadPendingBonuses, loadDeclarations, loadDirtySources])

  // ── Autocomplete Search ─────────────────────────────────────
  useEffect(() => {
    const searchUsers = async () => {
      if (recipient.length < 2) {
        setRecipientSuggestions([])
        return
      }

      // If recipient was selected from suggestion, don't search again
      if (recipientSuggestions.some(s => s.username === recipient || s.discord_id === recipient)) {
        return
      }

      try {
        const res = await fetch(`/api/bank/search-users?q=${encodeURIComponent(recipient)}`)
        const data = await res.json()
        setRecipientSuggestions(data.users || [])
        setShowSuggestions(true)
      } catch (err) {
        console.error('Search error:', err)
      }
    }

    const timer = setTimeout(searchUsers, 300)
    return () => clearTimeout(timer)
  }, [recipient, recipientSuggestions]) // Added recipientSuggestions to dependencies

  const canClaimDaily = () => {
    if (!profile?.last_daily) return true
    const lastClaim = new Date(profile.last_daily)
    const now = new Date()
    const diff = now.getTime() - lastClaim.getTime()
    const hours = diff / (1000 * 60 * 60)
    return hours >= 24
  }

  const getTimeUntilDaily = () => {
    if (!profile?.last_daily) return 'Disponible'
    const lastClaim = new Date(profile.last_daily)
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
    const now = new Date()
    const diff = nextClaim.getTime() - now.getTime()
    if (diff <= 0) return 'Disponible'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const handleTransfer = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer un montant valide' })
      return
    }

    if (parseFloat(amount) > (profile?.balance || 0)) {
      setMessage({ type: 'error', text: 'Solde insuffisant' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/bank/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          amount: parseFloat(amount),
          recipient
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: `Transfert de ${amount}€ effectué avec succès !` })
        setRecipient('')
        setAmount('')
        setRecipientSuggestions([])
        await refreshProfile()
        await loadTransactions()
      } else {
        setMessage({ type: 'error', text: data.error || 'Une erreur est survenue' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimDaily = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/bank/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'daily' })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Récompense quotidienne récupérée (+50€) !' })
        await refreshProfile()
        await loadTransactions()
      } else {
        setMessage({ type: 'error', text: data.error || 'Une erreur est survenue' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeclare = async () => {
    if (!selectedSourceId || !decReason) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une source et ajouter une justification' })
      return
    }

    const source = dirtySources.find(s => s.id === selectedSourceId)
    if (!source) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/bank/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: selectedSourceId,
          amount: source.amount,
          reason: decReason
        })
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Déclaration envoyée ! En attente de validation.' })
        setSelectedSourceId('')
        setDecReason('')
        await refreshProfile()
        await loadDeclarations()
        await loadDirtySources()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimBonus = async (bonusId: string) => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtIds: [bonusId] })
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Prime récupérée avec succès !' })
        await refreshProfile()
        await loadTransactions()
        await loadPendingBonuses()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la récupération' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="animate-slideIn">
        <h1 className="text-4xl font-black text-white tracking-tight">Banque</h1>
        <p className="text-discord-muted mt-1 font-medium">Gérez vos finances LunaVerse</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar / Tabs */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-2 space-y-1">
            <button
              onClick={() => setActiveTab('send')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                activeTab === 'send' ? "bg-discord-blurple text-white shadow-lg shadow-discord-blurple/20" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <Send className="w-5 h-5" />
              Transférer
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                activeTab === 'daily' ? "bg-discord-success text-discord-darker shadow-lg shadow-discord-success/20" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <Gift className="w-5 h-5" />
              Récompenses
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                activeTab === 'history' ? "bg-white/10 text-white" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <Clock className="w-5 h-5" />
              Historique
            </button>

            <button
              onClick={() => setActiveTab('declarations')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                activeTab === 'declarations' ? "bg-discord-warning text-discord-darker shadow-lg shadow-discord-warning/20" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <FileText className="w-5 h-5" />
              Déclarations
            </button>
          </div>

          {/* Credit Card Visual */}
          <div className="relative h-48 w-full rounded-2xl overflow-hidden p-6 text-white group shadow-xl transition-transform hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #5865F2, #3b42a0)', boxShadow: '0 15px 35px rgba(88,101,242,0.3)' }}>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl origin-top-right scale-150 transform-gpu group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-500/30 rounded-full blur-xl" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-0.5">Solde LunaVerse</p>
                  <p className="text-3xl font-black">{profile?.balance.toFixed(2)} €</p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-2">
                     PROFIL PREMIUM
                   </div>
                   {(profile as any)?.dirty_balance > 0 && (
                     <div className="text-right">
                       <p className="text-[9px] uppercase tracking-widest text-white/60 font-bold">Argent Sale</p>
                       <p className="text-sm font-black text-red-400">{(profile as any).dirty_balance.toFixed(0)} €</p>
                     </div>
                   )}
                </div>
              </div>
              
              <div>
                <p className="font-mono text-lg tracking-[0.2em] opacity-80 mb-1">
                  **** **** **** {(profile?.discord_id || '0000').slice(-4)}
                </p>
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold uppercase tracking-wider">{profile?.username || 'Utilisateur'}</p>
                  <p className="text-xs font-black italic">VISA</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'send' && (
            <div className="glass-card animate-fadeIn">
              <h3 className="text-xl font-black text-white mb-6">Nouveau transfert</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Destinataire</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-discord-muted group-focus-within:text-discord-blurple transition-colors" />
                    <input
                      type="text"
                      placeholder="Nom d'utilisateur ou ID Discord"
                      className="glass-input w-full pl-12"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      onFocus={() => recipientSuggestions.length > 0 && setShowSuggestions(true)}
                    />
                    
                    {/* Autocomplete Suggestions */}
                    {showSuggestions && recipientSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 animate-fadeIn space-y-1 shadow-2xl ring-1 ring-white/10">
                        {recipientSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => {
                              setRecipient(suggestion.username)
                              setShowSuggestions(false)
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left group"
                          >
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/10">
                              {suggestion.avatar_url ? (
                                <Image 
                                  src={suggestion.avatar_url} 
                                  alt="" 
                                  width={32} 
                                  height={32} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-discord-muted uppercase">
                                  {suggestion.username.substring(0, 2)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-white truncate group-hover:text-discord-blurple transition-colors">
                                {suggestion.username}
                              </p>
                              <p className="text-[10px] font-bold text-discord-muted uppercase tracking-widest truncate">
                                {suggestion.discord_id}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Click away listener to close suggestions */}
                    {showSuggestions && (
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSuggestions(false)}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Montant</label>
                  <div className="relative group">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-discord-muted group-focus-within:text-discord-blurple transition-colors" />
                    <input
                      type="number"
                      placeholder="0.00"
                      className="glass-input w-full pl-12"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {message && (
                  <div className={clsx(
                    "p-4 rounded-xl text-sm font-bold animate-fadeIn",
                    message.type === 'success' ? "bg-discord-success/10 text-discord-success border border-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20"
                  )}>
                    {message.text}
                  </div>
                )}

                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  className="btn btn-primary w-full py-4 text-lg mt-4"
                >
                  {loading ? 'Traitement...' : 'Confirmer le transfert'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="glass-card animate-fadeIn">
              <h3 className="text-xl font-black text-white mb-6">Récompenses disponibles</h3>
              <div className="space-y-4">
                {/* Admin/Manual Prizes */}
                {pendingBonuses.map((bonus) => (
                   <div key={bonus.id} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group animate-scaleIn">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-discord-blurple/20 rounded-xl flex items-center justify-center group-hover:bg-discord-blurple transition-colors">
                        <ArrowDownRight className="w-6 h-6 text-discord-blurple group-hover:text-white" />
                      </div>
                      <div>
                        <p className="text-white font-black">{bonus.reason}</p>
                        <p className="text-xs text-discord-muted font-bold uppercase tracking-widest">Récompense exceptionnelle</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-discord-success mb-2">+{Math.abs(bonus.amount).toFixed(0)}€</p>
                      <button
                        onClick={() => handleClaimBonus(bonus.id)}
                        disabled={loading}
                        className="btn btn-sm btn-primary"
                      >
                        {loading ? '...' : 'Réclamer'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Daily Reward */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-discord-success/20 rounded-xl flex items-center justify-center group-hover:bg-discord-success transition-colors">
                      <Gift className="w-6 h-6 text-discord-success group-hover:text-discord-darker" />
                    </div>
                    <div>
                      <p className="text-white font-black">Récompense Quotidienne</p>
                      <p className="text-xs text-discord-muted font-bold uppercase tracking-widest">
                        {canClaimDaily() ? 'Prêt à être récupéré' : `Prochain dans ${getTimeUntilDaily()}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white mb-2">+50€</p>
                    <button
                      onClick={handleClaimDaily}
                      disabled={!canClaimDaily() || loading}
                      className={clsx(
                        "btn btn-sm",
                        canClaimDaily() ? "btn-success" : "btn-ghost opacity-50"
                      )}
                    >
                      {canClaimDaily() ? 'Réclamer' : 'Attendre'}
                    </button>
                  </div>
                </div>

                {pendingBonuses.length === 0 && !canClaimDaily() && (
                   <div className="p-12 text-center opacity-50">
                     <Clock className="w-12 h-12 mx-auto mb-4 text-discord-muted" />
                     <p className="text-white font-bold">Aucune autre récompense pour le moment</p>
                     <p className="text-sm text-discord-muted">Revenez plus tard pour de nouveaux bonus !</p>
                   </div>
                )}
              </div>
            </div>
          )}



          {activeTab === 'declarations' && (
            <div className="animate-fadeIn space-y-6">
              <div className="glass-card">
                <h3 className="text-xl font-black text-white mb-2">Blanchiment & Déclarations</h3>
                <p className="text-discord-muted text-sm mb-6">Sélectionnez une source de revenus non-déclarée pour la blanchir. Vous recevrez 100% de la somme après validation admin (sauf pénalité fiscale).</p>
                
                <div className="space-y-6">
                  {/* Source Selection List */}
                  <div>
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-3 block">Winnings disponibles (Argent Sale)</label>
                    {dirtySources.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-white/3 border border-white/5 border-dashed">
                        <p className="text-discord-muted text-sm font-bold">Aucun gain à blanchir pour le moment.</p>
                      </div>
                    ) : (
                      <div className="grid gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {dirtySources.map((source: any) => (
                          <button
                            key={source.id}
                            onClick={() => {
                              setSelectedSourceId(source.id)
                              if (!decReason) setDecReason(`Blanchiment : ${source.source} (${source.amount}€)`)
                            }}
                            className={clsx(
                              "w-full p-4 rounded-2xl border text-left transition-all group flex items-center justify-between",
                              selectedSourceId === source.id 
                                ? "bg-discord-blurple/20 border-discord-blurple shadow-lg" 
                                : "bg-white/3 border-white/5 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", selectedSourceId === source.id ? "bg-discord-blurple text-white" : "bg-white/5 text-discord-muted group-hover:text-white")}>
                                <Briefcase size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{source.source}</p>
                                <p className="text-[10px] text-discord-muted uppercase tracking-tight">{source.details} — {new Date(source.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-amber-400">{source.amount.toFixed(0)}€</p>
                              {selectedSourceId === source.id && <CheckCircle2 size={16} className="text-discord-blurple animate-bounce ml-auto mt-1" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSourceId && (
                    <div className="space-y-4 animate-slideUp">
                      <div>
                        <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Justification (Storytelling RP)</label>
                        <textarea
                          placeholder="Pourquoi avez-vous cet argent ? (Job d'appoint, don, vente d'objet...)"
                          className="glass-input w-full min-h-[100px] py-4"
                          value={decReason}
                          onChange={(e) => setDecReason(e.target.value)}
                        />
                      </div>

                      {message && (
                        <div className={clsx(
                          "p-4 rounded-xl text-sm font-bold animate-fadeIn",
                          message.type === 'success' ? "bg-discord-success/10 text-discord-success border border-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20"
                        )}>
                          {message.text}
                        </div>
                      )}

                      <button
                        onClick={handleDeclare}
                        disabled={loading}
                        className="btn btn-warning w-full py-4 text-base shadow-xl shadow-discord-warning/10"
                      >
                        {loading ? 'Soumission en cours...' : 'Soumettre le dossier aux autorités'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* History */}
              <div className="glass-card p-2">
                <h3 className="text-lg font-black text-white px-4 py-4">Demandes récentes</h3>
                <div className="space-y-1">
                  {declarations.length > 0 ? (
                    declarations.map((dec) => (
                      <div key={dec.id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors group">
                        <div className={clsx(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                          dec.status === 'accepted' ? "bg-discord-success/20 text-discord-success" : 
                          dec.status === 'refused' ? "bg-discord-error/20 text-discord-error" : 
                          "bg-discord-warning/20 text-discord-warning"
                        )}>
                          {dec.status === 'accepted' ? <CheckCircle2 className="w-6 h-6" /> : 
                           dec.status === 'refused' ? <AlertCircle className="w-6 h-6" /> : 
                           <Clock className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold truncate">{dec.reason}</p>
                          <p className="text-[10px] font-black text-discord-muted uppercase tracking-[0.2em]">
                            {dec.source} — {new Date(dec.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white">{dec.amount.toFixed(0)} €</p>
                          <p className={clsx(
                            "text-[10px] font-black uppercase tracking-widest",
                            dec.status === 'accepted' ? "text-discord-success" : 
                            dec.status === 'refused' ? "text-discord-error" : 
                            "text-discord-warning"
                          )}>
                            {dec.status === 'accepted' ? 'Validé' : 
                             dec.status === 'refused' ? 'Refusé' : 
                             'En attente'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center opacity-50">
                      <p className="text-discord-muted font-bold text-sm">Aucune déclaration trouvée.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
