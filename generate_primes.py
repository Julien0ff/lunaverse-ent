import re

with open('src/app/admin/page.old.tsx', 'r') as f:
    content = f.read()

header = """'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Search, Check, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import clsx from 'clsx'

interface AdminUser {
  id: string; discord_id: string; username: string; balance: number
}
interface TaxRecord {
  id: string; user_id: string; reason: string; amount: number; is_preleve: boolean; is_paid: boolean
  target?: { username: string; discord_id: string }
}

export default function AdminPrimesPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [taxes, setTaxes] = useState<TaxRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [giveSelectedIds, setGiveSelectedIds] = useState<string[]>([])
  const [giveUserSearch, setGiveUserSearch] = useState('')
  const [givePickerOpen, setGivePickerOpen] = useState(false)
  const [giveAmount, setGiveAmount] = useState('')
  const [giveReason, setGiveReason] = useState('')
  const [giveAutoAdd, setGiveAutoAdd] = useState(false)

  useEffect(() => {
    Promise.all([loadUsers(), loadTaxes()]).finally(() => setLoading(false))
  }, [])

  const loadUsers = async () => {
    const r = await fetch('/api/admin/users')
    if (r.ok) setUsers((await r.json()).users || [])
  }
  const loadTaxes = async () => {
    const r = await fetch('/api/admin/taxes')
    if (r.ok) setTaxes((await r.json()).taxes || [])
  }

  const showMsg = (type: 'success'|'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const giveMoney = async () => {
    if (!giveSelectedIds.length || !giveAmount) return
    setLoading(true)
    try {
      let successCount = 0
      for (const targetId of giveSelectedIds) {
        const targetUser = users.find(u => u.id === targetId)
        if (!targetUser) continue

        const res = await fetch('/api/admin/give-money', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: targetUser.discord_id || targetUser.username,
            amount: giveAmount,
            reason: giveReason,
            auto_add: giveAutoAdd
          })
        })
        if (res.ok) successCount++
      }
      showMsg('success', `✅ Opération réussie pour ${successCount} utilisateur(s).`)
      setGiveAmount('')
      setGiveReason('')
      setGiveSelectedIds([])
      setGiveUserSearch('')
      loadTaxes()
    } catch (e) {
      showMsg('error', 'Erreur')
    }
    setLoading(false)
  }

  const deleteTax = async (id: string) => {
    const r = await fetch(`/api/admin/taxes?id=${id}`, { method: 'DELETE' })
    if (r.ok) { showMsg('success', 'Prime supprimée'); loadTaxes() }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-white">Bourses & Primes</h2>
        <p className="text-discord-muted">Distribuez de l'argent et des primes aux joueurs.</p>
      </div>

      {msg && (
        <div className={clsx("p-4 rounded-xl text-sm font-bold flex items-center gap-2", msg.type === 'success' ? "bg-discord-success/10 text-discord-success" : "bg-discord-error/10 text-discord-error")}>
          <AlertCircle className="w-5 h-5" /> {msg.text}
        </div>
      )}
"""

# Extract the JSX part for money
start_idx = content.find("      {tab === 'money' && (")
if start_idx != -1:
    end_idx = content.find("      {tab === 'finances' && (", start_idx)
    jsx = content[start_idx:end_idx]
    
    # Remove the wrapper
    jsx = jsx.replace("      {tab === 'money' && (", "")
    jsx = jsx.rsplit("      )}", 1)[0]
    
    # We also need the primes list from finances tab
    finances_start = content.find("      {tab === 'finances' && (")
    primes_start = content.find("{/* Primes list (Negative taxes) */}", finances_start)
    if primes_start != -1:
        primes_end = content.find("        </div>\n      )}", primes_start)
        primes_jsx = content[primes_start:primes_end]
        
        # Inject primes list at the end of the grid (replace the last </div>)
        jsx = jsx.rsplit("        </div>", 1)[0] + "        </div>\n" + primes_jsx

    with open('src/app/admin/primes/page.tsx', 'w') as out:
        out.write(header + jsx + "\n    </div>\n  )\n}\n")
