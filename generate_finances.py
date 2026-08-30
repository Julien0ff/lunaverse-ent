import re

with open('src/app/admin/page.old.tsx', 'r') as f:
    content = f.read()

header = """'use client'

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
"""

# Extract the JSX part for finances
start_idx = content.find("      {tab === 'finances' && (")
if start_idx != -1:
    end_idx = content.find("      {tab === 'shop' && (", start_idx)
    jsx = content[start_idx:end_idx]
    
    # Remove the wrapper
    jsx = jsx.replace("      {tab === 'finances' && (", "")
    jsx = jsx.rsplit("      )}", 1)[0]
    
    # Primes list extraction (from Primes list (Negative taxes) comment to end)
    primes_idx = jsx.find("{/* Primes list (Negative taxes) */}")
    if primes_idx != -1:
        jsx = jsx[:primes_idx] # Remove primes part

    with open('src/app/admin/finances/page.tsx', 'w') as out:
        out.write(header + jsx + "\n    </div>\n  )\n}\n")
