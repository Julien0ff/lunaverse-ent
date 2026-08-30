'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import { Search, Loader2, User, Activity, AlertCircle, Download, ShieldCheck, HeartPulse } from 'lucide-react'
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

  const handleDownloadPfp = async (e: React.MouseEvent, url: string, username: string) => {
    e.stopPropagation()
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `pfp_${username.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error downloading PFP:', error)
      window.open(url, '_blank') // fallback
    }
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.nickname_rp && u.nickname_rp.toLowerCase().includes(search.toLowerCase())) ||
    u.discord_id.includes(search)
  )

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Premium */}
      <div className="relative bg-black/40 border border-white/5 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-discord-blurple/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-discord-blurple/20 flex items-center justify-center border border-discord-blurple/30 shadow-lg shadow-discord-blurple/10">
              <ShieldCheck className="w-7 h-7 text-discord-blurple" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Utilisateurs</h2>
              <p className="text-discord-muted font-medium mt-1">Supervision globale des citoyens de l'ENT.</p>
            </div>
          </div>
          
          <div className="flex items-center w-full md:w-auto bg-black/50 border border-white/10 rounded-2xl p-2 shadow-inner focus-within:border-discord-blurple/50 focus-within:ring-1 focus-within:ring-discord-blurple/50 transition-all">
            <Search className="w-5 h-5 text-discord-muted ml-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher (Nom, Pseudo RP, ID)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none text-white text-sm focus:outline-none px-3 py-2 w-full md:w-64 placeholder-white/20 font-medium"
            />
            <div className="bg-white/5 text-xs font-bold px-2 py-1 rounded-lg text-discord-muted ml-2">
              {filteredUsers.length}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/20 border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40">
                <th className="py-5 px-6 text-xs font-black text-discord-muted uppercase tracking-[0.2em]">Citoyen</th>
                <th className="py-5 px-6 text-xs font-black text-discord-muted uppercase tracking-[0.2em] text-right">Patrimoine</th>
                <th className="py-5 px-6 text-xs font-black text-discord-muted uppercase tracking-[0.2em] text-center">Statut RP / Accès</th>
                <th className="py-5 px-6 text-xs font-black text-discord-muted uppercase tracking-[0.2em] text-center">Vitalité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-discord-muted" />
                    </div>
                    <p className="text-discord-muted font-bold">Aucun citoyen trouvé.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative group/avatar">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} width={48} height={48} alt="" className="rounded-2xl border border-white/10 shadow-sm transition-transform group-hover/avatar:scale-105" />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
                              <User className="w-6 h-6 text-white/50" />
                            </div>
                          )}
                          {!u.first_connection && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-discord-error rounded-full border-[3px] border-[#121316] shadow-sm animate-pulse" title="Tutoriel non terminé" />
                          )}
                          
                          {/* PFP Download Button */}
                          {u.avatar_url && (
                            <button
                              onClick={(e) => handleDownloadPfp(e, u.avatar_url!, u.username)}
                              className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-sm"
                              title="Télécharger l'avatar"
                            >
                              <Download className="w-5 h-5 text-white" />
                            </button>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-white text-base tracking-tight">{u.nickname_rp || u.username}</p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-[10px] font-mono font-medium text-discord-muted bg-black/50 px-2 py-0.5 rounded border border-white/5">{u.discord_id}</span>
                            {u.nickname_rp && <span className="text-[10px] font-bold text-discord-muted/80 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">{u.username}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5 font-mono text-lg font-black text-discord-success drop-shadow-[0_0_8px_rgba(87,242,135,0.2)]">
                        {u.balance?.toLocaleString()} <span className="text-sm">€</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map(r => (
                              <span key={r.id} className="text-[10px] uppercase font-black tracking-[0.15em] px-2.5 py-1 rounded-lg bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30 shadow-inner">
                                {r.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] uppercase font-black tracking-[0.15em] px-2.5 py-1 rounded-lg bg-discord-warning/20 text-discord-warning border border-discord-warning/30 flex items-center justify-center gap-1.5">
                              <AlertCircle className="w-3 h-3" /> SANS RÔLE
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleFirstConnection(u.id, !!u.first_connection)}
                          className={clsx(
                            "text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg transition-all shadow-sm border",
                            u.first_connection 
                              ? "bg-discord-success/10 text-discord-success border-discord-success/20 hover:bg-discord-success/20" 
                              : "bg-discord-error/10 text-discord-error border-discord-error/20 hover:bg-discord-error/20"
                          )}
                          title={u.first_connection ? 'Cliquer pour forcer le tutoriel' : 'Cliquer pour valider le tutoriel'}
                        >
                          {u.first_connection ? 'CITOYEN ACTIF' : 'NOUVEAU (TUTO)'}
                        </button>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                          <div className={clsx("flex items-center gap-1.5 text-xs font-bold", u.hunger < 30 ? "text-red-400" : "text-zinc-400")}>
                            <span className="text-base drop-shadow-md">🍔</span>
                            <span>{u.hunger}%</span>
                          </div>
                          <div className="w-px h-4 bg-white/10" />
                          <div className={clsx("flex items-center gap-1.5 text-xs font-bold", u.thirst < 30 ? "text-red-400" : "text-zinc-400")}>
                            <span className="text-base drop-shadow-md">💧</span>
                            <span>{u.thirst}%</span>
                          </div>
                          <div className="w-px h-4 bg-white/10" />
                          <div className={clsx("flex items-center gap-1.5 text-xs font-bold", u.fatigue < 30 ? "text-red-400" : "text-zinc-400")}>
                            <span className="text-base drop-shadow-md">😴</span>
                            <span>{u.fatigue}%</span>
                          </div>
                        </div>
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
