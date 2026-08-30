'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import { Search, Loader2, User, Activity, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface AdminUser {
  id: string; discord_id: string; username: string
  avatar_url: string | null; balance: number; created_at: string
  pronote_id: string | null; nickname_rp?: string
  health: number; hunger: number; thirst: number; fatigue: number; hygiene: number; alcohol: number
  first_connection?: boolean
  roles?: { id: string; name: string }[]
}

export default function AdminUsersPage() {
  const { roles } = useAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/users')
      if (r.ok) {
        const data = await r.json()
        setUsers(data.users || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleFirstConnection = async (userId: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, first_connection: !current })
      })
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, first_connection: !current } : u))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.nickname_rp && u.nickname_rp.toLowerCase().includes(search.toLowerCase())) ||
    u.discord_id.includes(search)
  )

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">Utilisateurs</h2>
          <p className="text-discord-muted">Gérez les comptes joueurs et leurs statistiques.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 min-w-[280px]">
          <Search className="w-5 h-5 text-discord-muted ml-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher (Nom, Pseudo RP, ID)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1.5 w-full"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest">Utilisateur</th>
                <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest text-right">Solde</th>
                <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest text-center">Statut RP</th>
                <th className="p-4 text-xs font-black text-discord-muted uppercase tracking-widest text-center">Survie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-discord-muted">Aucun utilisateur trouvé.</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} width={40} height={40} alt="" className="rounded-full bg-white/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-white/50" />
                            </div>
                          )}
                          {!u.first_connection && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-discord-error rounded-full border-2 border-[#121316]" title="Jamais connecté à l'ENT" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{u.nickname_rp || u.username}</p>
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-mono text-discord-muted">{u.discord_id}</span>
                            {u.nickname_rp && <span className="text-[10px] text-discord-muted bg-white/5 px-1.5 rounded">{u.username}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-discord-success font-bold bg-discord-success/10 px-2 py-1 rounded-lg">
                        {u.balance?.toFixed(0) || '0'} €
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map(r => (
                              <span key={r.id} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30">
                                {r.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full bg-discord-warning/20 text-discord-warning flex items-center justify-center gap-1 w-max mx-auto">
                              <AlertCircle className="w-3 h-3" /> En attente (Aucun Rôle)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleFirstConnection(u.id, !!u.first_connection)}
                          className={clsx(
                            "text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full transition-colors",
                            u.first_connection 
                              ? "bg-discord-success/20 text-discord-success hover:bg-discord-success/30" 
                              : "bg-discord-error/20 text-discord-error hover:bg-discord-error/30"
                          )}
                          title={u.first_connection ? 'Cliquer pour désactiver le tutoriel' : 'Cliquer pour réactiver le tutoriel'}
                        >
                          {u.first_connection ? 'Tutoriel Terminé' : 'Tutoriel Actif'}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-discord-muted">
                        <span className={clsx("flex items-center gap-1", u.hunger < 20 ? "text-discord-error" : "")}>🍔 {u.hunger}%</span>
                        <span className={clsx("flex items-center gap-1", u.thirst < 20 ? "text-discord-error" : "")}>💧 {u.thirst}%</span>
                        <span className={clsx("flex items-center gap-1", u.fatigue < 20 ? "text-discord-error" : "")}>😴 {u.fatigue}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
