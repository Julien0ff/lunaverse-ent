'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Wallet, ArrowUpRight, ArrowDownRight, Gift, Clock, Search, Send, Briefcase, FileText, CheckCircle2, AlertCircle, Euro, ChevronDown, Loader2 } from 'lucide-react'
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
  created_at: string
}

export default function Bank() {
  const { profile, roles, user, refreshProfile } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'daily' | 'declarations'>('send')
  const [recipient, setRecipient] = useState('')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false)
  const [recipientSuggestions, setRecipientSuggestions] = useState<any[]>([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pendingBonuses, setPendingBonuses] = useState<any[]>([])
  const [declarations, setDeclarations] = useState<any[]>([])
  const [dirtySources, setDirtySources] = useState<any[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>('')
  
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

  useEffect(() => {
    const searchUsers = async () => {
      if (!recipientSearch || recipientSearch.length < 2) {
        setRecipientSuggestions([])
        return
      }
      try {
        const res = await fetch(`/api/bank/search-users?q=${encodeURIComponent(recipientSearch)}`)
        const data = await res.json()
        setRecipientSuggestions(data.users || [])
      } catch (err) {
        console.error('Search error:', err)
      }
    }
    const timer = setTimeout(searchUsers, 300)
    return () => clearTimeout(timer)
  }, [recipientSearch])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-recipient-picker]')) setRecipientPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const canClaimDaily = () => {
    if (!profile?.last_daily) return true
    const lastClaim = new Date(profile.last_daily)
    const now = new Date()
    const diff = now.getTime() - lastClaim.getTime()
    const hours = diff / (1000 * 60 * 60)
    return hours >= 24
  }

  const getTimeUntilDaily = () => {
    if (!profile?.last_daily) return t('bank_page.available')
    const lastClaim = new Date(profile.last_daily)
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
    const now = new Date()
    const diff = nextClaim.getTime() - now.getTime()
    if (diff <= 0) return t('bank_page.available')
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const handleTransfer = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: t('bank_page.invalid_amount') })
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
        setMessage({ type: 'success', text: t('bank_page.transfer_success').replace('{amount}', amount) })
        setRecipient('')
        setRecipientSearch('')
        setAmount('')
        await refreshProfile()
        await loadTransactions()
      } else {
        setMessage({ type: 'error', text: data.error || t('bank_page.error_occurred') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('bank_page.connection_error') })
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
        setMessage({ type: 'success', text: t('bank_page.daily_success') })
        await refreshProfile()
        await loadTransactions()
      } else {
        setMessage({ type: 'error', text: data.error || t('bank_page.error_occurred') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('bank_page.connection_error') })
    } finally {
      setLoading(false)
    }
  }

  const handleDeclare = async () => {
    if (!selectedSourceId || !decReason) {
      setMessage({ type: 'error', text: t('bank_page.select_source_reason') })
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
        setMessage({ type: 'success', text: t('bank_page.declaration_sent') })
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
        setMessage({ type: 'success', text: t('bank_page.bonus_success') })
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
      <div className="animate-slideIn">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <Wallet className="w-10 h-10 text-discord-blurple" />
          {t('bank_page.title')}
        </h1>
        <p className="text-discord-muted mt-1 font-medium">{t('bank_page.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              {t('bank_page.tab_send')}
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                activeTab === 'daily' ? "bg-discord-success text-discord-darker shadow-lg shadow-discord-success/20" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <Gift className="w-5 h-5" />
              {t('bank_page.tab_rewards')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                activeTab === 'history' ? "bg-white/10 text-white" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <Clock className="w-5 h-5" />
              {t('bank_page.tab_history')}
            </button>
            <button
              onClick={() => setActiveTab('declarations')}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm",
                activeTab === 'declarations' ? "bg-discord-warning text-discord-darker shadow-lg shadow-discord-warning/20" : "text-discord-muted hover:bg-white/5"
              )}
            >
              <FileText className="w-5 h-5" />
              {t('bank_page.tab_declarations')}
            </button>
          </div>

          <div className="relative h-48 w-full rounded-2xl overflow-hidden p-6 text-white group shadow-xl transition-transform hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #5865F2, #3b42a0)', boxShadow: '0 15px 35px rgba(88,101,242,0.3)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl origin-top-right scale-150 transform-gpu group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-500/30 rounded-full blur-xl" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white font-bold mb-0.5">{t('bank_page.balance_label')}</p>
                  <p className="text-3xl font-black text-white">{profile?.balance.toFixed(2)} €</p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-2">{t('bank_page.premium')}</div>
                   {(profile as any)?.dirty_balance > 0 && (
                     <div className="text-right">
                       <p className="text-[9px] uppercase tracking-widest text-white font-bold">{t('bank_page.dirty_money')}</p>
                       <p className="text-sm font-black text-red-400">{(profile as any).dirty_balance.toFixed(0)} €</p>
                     </div>
                   )}
                </div>
              </div>
              <div>
                <p className="font-mono text-lg tracking-[0.2em] text-white/90 mb-1">**** **** **** {(profile?.discord_id || '0000').slice(-4)}</p>
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold uppercase tracking-wider text-white">{profile?.username || t('bank_page.user')}</p>
                  <p className="text-xs font-black italic text-white">VISA</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="lg:col-span-2">
          {activeTab === 'send' && (
            <div className="glass-card animate-fadeIn">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white mb-1">{t('bank_page.new_transfer')}</h3>
                  <p className="text-sm text-discord-muted">{t('bank_page.transfer_desc')}</p>
                </div>
                <div className="space-y-4">
                  <div className="relative" data-recipient-picker>
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">{t('bank_page.recipient')}</label>
                    <button
                      className="glass-input w-full flex items-center justify-between text-left focus:border-discord-blurple"
                      onClick={() => setRecipientPickerOpen(!recipientPickerOpen)}
                    >
                      <span className="truncate">
                        {recipient ? recipient : t('bank_page.select_recipient')}
                      </span>
                      <ChevronDown className={clsx('w-4 h-4 transition-transform', recipientPickerOpen && 'rotate-180')} />
                    </button>
                    {recipientPickerOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-discord-dark/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto flex flex-col custom-scrollbar">
                        <div className="sticky top-0 bg-discord-dark/95 p-2 border-b border-white/6 z-10">
                          <input
                            type="text"
                            placeholder={t('bank_page.search_by_name')}
                            className="glass-input w-full !py-1.5 !text-sm"
                            value={recipientSearch}
                            onChange={e => setRecipientSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        {recipientSuggestions.length === 0 ? (
                          <div className="p-4 text-center text-xs text-discord-muted italic">
                            {recipientSearch.length < 2 ? t('bank_page.type_2_chars') : t('bank_page.no_user_found')}
                          </div>
                        ) : (
                          recipientSuggestions.map(u => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setRecipient(u.username)
                                setRecipientPickerOpen(false)
                              }}
                              className={clsx('w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors hover:bg-white/5', recipient === u.username && 'bg-discord-blurple/10 text-discord-blurple')}
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-discord-dark border border-white/10">
                                <img src={u.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="font-bold text-white truncate">{u.username}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">{t('bank_page.amount')}</label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-muted" />
                      <input
                        type="number"
                        placeholder="0.00"
                        className="glass-input !pl-10"
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
                    {loading ? t('bank_page.processing') : t('bank_page.confirm_transfer')}
                  </button>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'history' && (
              <div className="glass-card animate-fadeIn">
                <h3 className="text-xl font-black text-white mb-6">{t('bank_page.tx_history')}</h3>
                <div className="space-y-3">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => {
                      const isPending = tx.description?.startsWith('PENDING:')
                      const displayDesc = isPending ? tx.description.replace('PENDING: ', '') : tx.description
                      const isOutgoing = tx.from_user_id === profile?.id || tx.amount < 0
                      
                      return (
                        <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-white/5">
                          <div className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                            !isOutgoing ? "bg-discord-success/20 text-discord-success" : "bg-white/5 text-discord-muted"
                          )}>
                            {!isOutgoing ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold truncate">{displayDesc || tx.type}</p>
                              {isPending && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter bg-orange-500/20 text-orange-500 border border-orange-500/20">
                                  {t('bank_page.pending')}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-black text-discord-muted uppercase tracking-[0.2em]">
                              {new Date(tx.created_at || tx.created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — {tx.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={clsx(
                              "text-lg font-black",
                              !isOutgoing ? "text-discord-success" : "text-discord-error"
                            )}>
                              {!isOutgoing ? '+' : ''}{tx.amount.toLocaleString()} €
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-12 text-center opacity-50">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-discord-muted" />
                      <p className="text-discord-muted font-bold text-sm">{t('bank_page.no_tx')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {activeTab === 'daily' && (
            <div className="glass-card animate-fadeIn">
              <h3 className="text-xl font-black text-white mb-6">{t('bank_page.rewards_title')}</h3>
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
                        <p className="text-xs text-discord-muted font-bold uppercase tracking-widest">{t('bank_page.exceptional_reward')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-discord-success mb-2">+{Math.abs(bonus.amount).toFixed(0)}€</p>
                      <button
                        onClick={() => handleClaimBonus(bonus.id)}
                        disabled={loading}
                        className="btn btn-sm btn-primary"
                      >
                        {loading ? '...' : t('bank_page.claim')}
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
                      <p className="text-white font-black">{t('bank_page.daily_reward')}</p>
                      <p className="text-xs text-discord-muted font-bold uppercase tracking-widest">
                        {canClaimDaily() ? t('bank_page.ready_to_claim') : t('bank_page.next_in').replace('{time}', getTimeUntilDaily())}
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
                      {canClaimDaily() ? t('bank_page.claim') : t('bank_page.wait')}
                    </button>
                  </div>
                </div>

                {pendingBonuses.length === 0 && !canClaimDaily() && (
                   <div className="p-12 text-center opacity-50">
                     <Clock className="w-12 h-12 mx-auto mb-4 text-discord-muted" />
                     <p className="text-white font-bold">{t('bank_page.no_more_rewards')}</p>
                     <p className="text-sm text-discord-muted">{t('bank_page.come_back')}</p>
                   </div>
                )}
              </div>
            </div>
          )}



          {activeTab === 'declarations' && (
            <div className="animate-fadeIn space-y-8">
              <div className="glass-card overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-discord-warning/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                
                <div className="relative z-10 flex items-start gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-discord-warning to-orange-500 flex items-center justify-center shadow-lg shadow-discord-warning/20 flex-shrink-0">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{t('bank_page.laundering_title')}</h3>
                    <p className="text-discord-muted mt-1">{t('bank_page.laundering_desc')}</p>
                  </div>
                </div>
                
                <div className="space-y-8 relative z-10">
                  {/* Source Selection List */}
                  <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5">
                    <label className="flex items-center gap-2 text-xs font-black text-discord-muted uppercase tracking-widest mb-4">
                      <span className="w-6 h-px bg-white/10" />
                      {t('bank_page.dirty_sources')}
                      <span className="flex-1 h-px bg-white/10" />
                    </label>
                    {dirtySources.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-8 h-8 text-discord-muted" />
                        </div>
                        <p className="text-white font-bold text-lg">{t('bank_page.no_dirty')}</p>
                        <p className="text-discord-muted text-sm mt-1">Vos finances sont en règle.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {dirtySources.map((source: any) => (
                          <button
                            key={source.id}
                            onClick={() => {
                              setSelectedSourceId(source.id)
                              if (!decReason) setDecReason(`Blanchiment : ${source.source} (${source.amount}€)`)
                            }}
                            className={clsx(
                              "w-full p-5 rounded-2xl border text-left transition-all group flex items-center justify-between",
                              selectedSourceId === source.id 
                                ? "bg-gradient-to-r from-discord-warning/20 to-transparent border-discord-warning/50 shadow-[0_0_20px_rgba(254,231,92,0.1)]" 
                                : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={clsx(
                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-inner", 
                                selectedSourceId === source.id ? "bg-discord-warning text-black" : "bg-black/50 text-gray-400 group-hover:text-white"
                              )}>
                                <Briefcase size={24} />
                              </div>
                              <div>
                                <p className={clsx("font-black text-lg", selectedSourceId === source.id ? "text-discord-warning" : "text-white")}>{source.source}</p>
                                <p className="text-xs text-gray-400 font-medium">{source.details} • {new Date(source.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={clsx("text-xl font-black", selectedSourceId === source.id ? "text-discord-warning" : "text-gray-300")}>
                                {source.amount.toLocaleString()} €
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSourceId && (
                    <div className="space-y-4 animate-slideUp bg-discord-warning/5 p-6 rounded-[2rem] border border-discord-warning/20">
                      <div>
                        <label className="text-xs font-black text-discord-warning uppercase tracking-widest mb-2 block flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {t('bank_page.justification')}
                        </label>
                        <textarea
                          placeholder={t('bank_page.justification_placeholder')}
                          className="w-full min-h-[120px] bg-black/40 border border-discord-warning/30 rounded-2xl p-4 text-white focus:outline-none focus:border-discord-warning focus:ring-1 focus:ring-discord-warning transition-all resize-none font-medium"
                          value={decReason}
                          onChange={(e) => setDecReason(e.target.value)}
                        />
                      </div>

                      {message && (
                        <div className={clsx(
                          "p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-fadeIn",
                          message.type === 'success' ? "bg-discord-success/20 text-discord-success" : "bg-discord-error/20 text-discord-error"
                        )}>
                          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                          {message.text}
                        </div>
                      )}

                      <button
                        onClick={handleDeclare}
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all bg-discord-warning hover:bg-yellow-500 text-black shadow-[0_0_20px_rgba(254,231,92,0.3)] hover:shadow-[0_0_30px_rgba(254,231,92,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('bank_page.submit_case')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-discord-blurple" />
                  {t('bank_page.recent_requests')}
                </h3>
                
                <div className="space-y-3">
                  {declarations.length > 0 ? (
                    declarations.map((dec) => (
                      <div key={dec.id} className="group relative bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 p-5 rounded-[1.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0",
                            dec.status === 'accepted' ? "bg-discord-success text-white" : 
                            dec.status === 'refused' ? "bg-discord-error text-white" : 
                            "bg-discord-warning text-black"
                          )}>
                            {dec.status === 'accepted' ? <CheckCircle2 className="w-6 h-6" /> : 
                             dec.status === 'refused' ? <AlertCircle className="w-6 h-6" /> : 
                             <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-white font-bold text-lg">{dec.reason}</p>
                            <p className="text-xs font-medium text-discord-muted">
                              {dec.source} • {new Date(dec.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center md:flex-col md:items-end justify-between w-full md:w-auto gap-2">
                          <p className="text-2xl font-black text-white">{dec.amount.toLocaleString()} €</p>
                          <span className={clsx(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                            dec.status === 'accepted' ? "bg-discord-success/20 text-discord-success" : 
                            dec.status === 'refused' ? "bg-discord-error/20 text-discord-error" : 
                            "bg-discord-warning/20 text-discord-warning"
                          )}>
                            {dec.status === 'accepted' ? t('bank_page.validated') : 
                             dec.status === 'refused' ? (dec.has_penalty ? 'Refusé (Amende)' : t('bank_page.refused')) : 
                             t('bank_page.pending_status')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center border border-white/5 border-dashed rounded-[2rem] bg-white/3">
                      <p className="text-discord-muted font-bold text-sm">{t('bank_page.no_declarations')}</p>
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
