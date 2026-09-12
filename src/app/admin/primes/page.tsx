'use client'

import { useState, useEffect, useRef } from 'react'
import { Gift, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function AdminPrimesPage() {
  const [username, setUsername] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [autoAdd, setAutoAdd] = useState(false)

  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [users, setUsers] = useState<any[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !amount) return

    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/admin/give-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUserId || username,
          amount: Number(amount),
          reason,
          auto_add: autoAdd
        })
      })

      const data = await res.json()

      if (res.ok) {
        setFeedback({ type: 'success', text: data.message || 'Prime envoyée avec succès !' })
        setUsername('')
        setSelectedUserId('')
        setAmount('')
        setReason('')
        setAutoAdd(false)
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erreur lors de l\'envoi de la prime.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erreur réseau.' })
    } finally {
      setLoading(false)
      setTimeout(() => setFeedback(null), 5000)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Gift className="text-discord-blurple w-8 h-8" />
          Gestion des Primes
        </h2>
        <p className="text-discord-muted mt-2">Envoyez de l'argent ou des primes aux utilisateurs du serveur.</p>
      </div>

      {feedback && (
        <div className={clsx(
          "p-4 rounded-xl flex items-center gap-3 font-bold animate-slideIn",
          feedback.type === 'success' ? "bg-discord-success/10 text-discord-success border border-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20"
        )}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {feedback.text}
        </div>
      )}

      <div className="glass-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 relative">
              <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Utilisateur (Prénom / Nom)</label>
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={e => {
                  setUsername(e.target.value)
                  setSelectedUserId('')
                  setSearchFocused(true)
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Ex: foxy123"
                className="glass-input w-full mt-1"
                required
              />
              {searchFocused && username.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#2B2D31] border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                  {users.filter(u => 
                    (u.nickname_rp?.toLowerCase() || '').includes(username.toLowerCase()) || 
                    u.username.toLowerCase().includes(username.toLowerCase())
                  ).slice(0, 10).map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault() // Prevents input from losing focus before click fires
                        setUsername(u.nickname_rp || u.username)
                        setSelectedUserId(u.discord_id || u.id)
                        setSearchFocused(false)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 text-white flex flex-col transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="font-bold">{u.nickname_rp || u.username}</span>
                      <span className="text-xs text-discord-muted">{u.username}</span>
                    </button>
                  ))}
                  {users.filter(u => 
                    (u.nickname_rp?.toLowerCase() || '').includes(username.toLowerCase()) || 
                    u.username.toLowerCase().includes(username.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-3 text-sm text-discord-muted text-center italic">
                      Aucun citoyen trouvé
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Montant (€)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 500"
                className="glass-input w-full mt-1"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Motif (Optionnel)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Récompense événement"
              className="glass-input w-full mt-1"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={autoAdd}
              onChange={e => setAutoAdd(e.target.checked)}
              className="luna-checkbox"
            />
            <div>
              <p className="font-bold text-white text-sm">Ajout Direct</p>
              <p className="text-xs text-discord-muted">Si coché, l'argent est immédiatement ajouté au solde. Sinon, l'utilisateur devra le réclamer via l'ENT.</p>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !username || !amount}
            className="btn btn-primary w-full py-4 text-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
              <>
                <Send className="w-5 h-5" />
                Envoyer la Prime
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
