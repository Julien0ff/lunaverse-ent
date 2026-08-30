'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Search, Check, Trash2, Loader2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface TaxRecord {
  id: string; user_id: string; reason: string; amount: number; is_preleve: boolean; is_paid: boolean
  target?: { username: string; discord_id: string }
}
interface AdminUser {
  id: string; discord_id: string; username: string; balance: number
}

export default function AdminFinancesPage() {
  const [taxes, setTaxes] = useState<TaxRecord[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [newTax, setNewTax] = useState({ reason: '', amount: '', auto_deduct: false })
  const [taxSelectedIds, setTaxSelectedIds] = useState<string[]>([])
  const [taxUserSearch, setTaxUserSearch] = useState('')
  const [taxPickerOpen, setTaxPickerOpen] = useState(false)

  useEffect(() => {
    Promise.all([loadTaxes(), loadUsers()]).finally(() => setLoading(false))
  }, [])

  const loadTaxes = async () => {
    const r = await fetch('/api/admin/taxes')
    if (r.ok) setTaxes((await r.json()).taxes || [])
  }
  const loadUsers = async () => {
    const r = await fetch('/api/admin/users')
    if (r.ok) setUsers((await r.json()).users || [])
  }

  const showMsg = (type: 'success'|'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const createTax = async () => {
    if (!taxSelectedIds.length) { showMsg('error', 'Sélectionnez au moins un utilisateur'); return }
    const r = await fetch('/api/admin/taxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_ids: taxSelectedIds, ...newTax, amount: +newTax.amount })
    })
    const d = await r.json()
    if (r.ok) {
      const partial = d.errors?.length ? ` (${d.errors.length} erreur(s))` : ''
      showMsg('success', `✅ ${d.applied} prélèvement(s) effectués${partial} !`)
      setNewTax({ reason: '', amount: '', auto_deduct: false })
      setTaxSelectedIds([])
      setTaxUserSearch('')
      loadTaxes()
    } else showMsg('error', d.error)
  }

  const deleteTax = async (id: string) => {
    const r = await fetch(`/api/admin/taxes?id=${id}`, { method: 'DELETE' })
    if (r.ok) { showMsg('success', 'Impôt supprimé'); loadTaxes() }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-white">Finances & Impôts</h2>
        <p className="text-discord-muted">Gérez les prélèvements et taxes des joueurs.</p>
      </div>

      {msg && (
        <div className={clsx("p-4 rounded-xl text-sm font-bold flex items-center gap-2", msg.type === 'success' ? "bg-discord-success/10 text-discord-success" : "bg-discord-error/10 text-discord-error")}>
          <AlertCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Create Tax */}
          <div className="glass-card">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-discord-error" /> Saisir un impôt / Redressement
            </h3>
            <div className="space-y-3">

              {/* ── Multi-user selector ── */}
              <div className="relative" data-tax-picker>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Utilisateurs cibles</label>

                {/* Selected tags */}
                {taxSelectedIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {taxSelectedIds.map(id => {
                      const u = users.find(u => u.id === id)
                      return (
                        <span key={id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-discord-error/15 text-discord-error border border-discord-error/25 font-bold">
                          {u?.username ?? id}
                          <button
                            onClick={() => setTaxSelectedIds(prev => prev.filter(x => x !== id))}
                            className="ml-0.5 hover:text-white transition-colors"
                          ><X className="w-3 h-3" /></button>
                        </span>
                      )
                    })}
                    <button
                      onClick={() => setTaxSelectedIds([])}
                      className="text-xs px-2 py-1 rounded-lg bg-white/5 text-discord-muted hover:text-white transition-colors"
                    >Tout effacer</button>
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-discord-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur…"
                    className="glass-input pl-9 text-sm"
                    value={taxUserSearch}
                    onChange={e => { setTaxUserSearch(e.target.value); setTaxPickerOpen(true) }}
                    onFocus={() => setTaxPickerOpen(true)}
                  />
                </div>

                {/* Dropdown list */}
                {taxPickerOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-[#1e1f22] border border-white/10 shadow-xl">
                    {/* Select All row */}
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-discord-blurple hover:bg-discord-blurple/10 transition-colors border-b border-white/6"
                      onClick={() => {
                        setTaxSelectedIds(users.map(u => u.id))
                        setTaxPickerOpen(false)
                        setTaxUserSearch('')
                      }}
                    >
                      <Check className="w-3.5 h-3.5" /> Sélectionner tout le serveur ({users.length})
                    </button>
                    {users
                      .filter(u => !taxUserSearch || u.username.toLowerCase().includes(taxUserSearch.toLowerCase()) || u.discord_id.includes(taxUserSearch))
                      .map(u => {
                        const selected = taxSelectedIds.includes(u.id)
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setTaxSelectedIds(prev =>
                                selected ? prev.filter(x => x !== u.id) : [...prev, u.id]
                              )
                            }}
                            className={clsx(
                              'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                              selected ? 'bg-discord-error/10 text-discord-error' : 'text-white hover:bg-white/5'
                            )}
                          >
                            {selected
                              ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                              : <div className="w-3.5 h-3.5 rounded border border-white/20 flex-shrink-0" />}
                            <span className="font-bold truncate">{u.username}</span>
                            <span className="text-xs text-discord-muted ml-auto font-mono">{u.balance?.toFixed(0)} €</span>
                          </button>
                        )
                      })}
                    {users.filter(u => !taxUserSearch || u.username.toLowerCase().includes(taxUserSearch.toLowerCase()) || u.discord_id.includes(taxUserSearch)).length === 0 && (
                      <p className="text-discord-muted text-xs p-3">Aucun résultat</p>
                    )}
                    <button
                      className="w-full text-xs text-discord-muted px-3 py-2 hover:bg-white/5 transition-colors border-t border-white/6"
                      onClick={() => setTaxPickerOpen(false)}
                    >Fermer ✕</button>
                  </div>
                )}
              </div>

              <input placeholder="Raison (ex: Redressement de juin)" className="glass-input"
                value={newTax.reason} onChange={e => setNewTax({ ...newTax, reason: e.target.value })} />
              <input type="number" placeholder="Montant à prélever (€)" className="glass-input"
                value={newTax.amount} onChange={e => setNewTax({ ...newTax, amount: e.target.value })} />

              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input type="checkbox" checked={newTax.auto_deduct} onChange={e => setNewTax({ ...newTax, auto_deduct: e.target.checked })} className="luna-checkbox" />
                <div>
                  <p className="text-sm font-bold text-white">Prélèvement automatique</p>
                  <p className="text-[10px] text-discord-muted">Si activé, l&apos;argent est débité immédiatement du solde. Sinon, le joueur devra payer manuellement.</p>
                </div>
              </label>

              <button
                onClick={createTax}
                disabled={!taxSelectedIds.length || !newTax.amount}
                className="btn btn-error w-full text-white bg-discord-error/20 hover:bg-discord-error hover:border-discord-error disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Appliquer et Prélever{taxSelectedIds.length > 1 ? ` (${taxSelectedIds.length} utilisateurs)` : ''}
              </button>
            </div>
            <div className="mt-4 p-4 bg-discord-blurple/10 border border-discord-blurple/20 rounded-xl text-sm text-discord-blurple flex gap-2">
              <span className="text-lg">💡</span>
              Pour programmer les impôts globaux du serveur, modifiez le cron de Discord ou l&apos;intervalle dans `discord-bot.ts` directement ou utilisez le bouton ci-dessous, ce prélèvement est immédiat.
            </div>
          </div>

          {/* Taxes list */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest px-1">Historique des Prélèvements ({taxes.filter(t => Number(t.amount) > 0).length})</h3>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {taxes.filter(t => Number(t.amount) > 0).map(t => (
                <div key={t.id} className="glass-card flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-bold text-white text-sm">
                      Utilisateur : <span className="text-discord-blurple font-bold">@{t.target?.username || t.user_id || 'Inconnu'}</span>
                    </p>
                    <p className="text-xs text-discord-muted">{t.reason}</p>
                    <div className="mt-1 flex items-center gap-2">
                       <span className="text-discord-error font-black">-{t.amount}€</span>
                       {t.is_preleve ? <span className="bg-discord-success/20 text-discord-success px-2 py-0.5 rounded text-[10px] font-bold">Prélevé</span> : <span className="bg-discord-warning/20 text-discord-warning px-2 py-0.5 rounded text-[10px] font-bold">En attente</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteTax(t.id)} className="btn btn-error px-2 py-1.5 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {taxes.filter(t => Number(t.amount) > 0).length === 0 && <p className="text-discord-muted text-sm px-1">Aucun prélèvement enregistré.</p>}
            </div>
          </div>
        </div>
    </div>
  )
}
