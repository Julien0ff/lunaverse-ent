'use client'

import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, Gift, ArrowUpRight, ArrowDownRight, History, Users, Trophy } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import clsx from 'clsx'

interface Transaction {
  id: string
  amount: number
  description: string
  created: string
  type: string
}

export default function Dashboard() {
  const { profile, roles, refreshProfile } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [socialData, setSocialData] = useState<{ onlineUsers: any[], leaderboard: any[] }>({ onlineUsers: [], leaderboard: [] })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/bank/transactions')
        if (response.ok) {
          const data = await response.json()
          setRecentTransactions(data.items.slice(0, 5))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.id) {
      fetchDashboardData()
      fetch('/api/dashboard/social').then(r => r.json()).then(d => setSocialData(d))
    }
  }, [profile?.id])

  const canClaimDaily = () => {
    if (!profile?.last_daily) return true
    const lastClaim = new Date(profile.last_daily)
    const now = new Date()
    return (now.getTime() - lastClaim.getTime()) >= 24 * 60 * 60 * 1000
  }

  const handleClaimDaily = async () => {
    setClaiming(true)
    setMessage(null)

    try {
      const response = await fetch('/api/bank/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'daily' })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Récompense récupérée ! (+50€)' })
        await refreshProfile()
        // Refresh transactions locally to show the new one
        const txResponse = await fetch('/api/bank/transactions')
        if (txResponse.ok) {
          const txData = await txResponse.json()
          setRecentTransactions(txData.items.slice(0, 5))
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Une erreur est survenue' })
      }
      setTimeout(() => setMessage(null), 4000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
      setTimeout(() => setMessage(null), 4000)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="animate-slideIn">
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Salut{profile?.username ? <>, <span className="text-discord-blurple">{profile.username}</span></> : ''} !
          </h1>
          <p className="text-discord-muted mt-2 font-medium">Bon retour sur l&apos;ENT LunaVerse.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <div className="lg:col-span-2 glass-card overflow-hidden relative group min-h-[250px] flex flex-col justify-between border-discord-blurple/20">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <Wallet className="w-48 h-48" />
          </div>

          <div className="relative z-10">
            <p className="text-discord-muted text-xs font-black uppercase tracking-[0.2em] mb-2">Solde LunaVerse</p>
            <h2 className="text-6xl font-black text-white tracking-tighter">
              {profile?.balance.toFixed(0)} <span className="text-2xl text-discord-blurple">€</span>
            </h2>
          </div>

          <div className="relative z-10 flex gap-4 mt-8">
            <Link href="/bank" className="btn btn-primary flex-1 py-4 text-lg">
              <ArrowUpRight className="w-5 h-5" />
              Transférer
            </Link>
            <Link href="/bank" className="btn btn-ghost flex-1 py-4 text-lg">
              <History className="w-5 h-5" />
              Historique
            </Link>
          </div>
        </div>

        {/* Online Users */}
        <div className="space-y-4">
          <div className="glass-card border-discord-blurple/20 min-h-full">
            <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-discord-blurple" />
              Connectés ({socialData.onlineUsers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {socialData.onlineUsers.length > 0 ? socialData.onlineUsers.map(user => (
                <Link 
                  key={user.id} 
                  href={`/profile/${user.username}`} // Fallback to current profile or search
                  className="group relative"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-discord-blurple/20 group-hover:ring-discord-blurple transition-all">
                    <Image 
                      src={user.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                      alt={user.username} width={40} height={40} className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-discord-success rounded-full border-2 border-[#121316] shadow-sm" />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-[10px] font-black rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {user.nickname_rp || user.username}
                  </div>
                </Link>
              )) : (
                <p className="text-[10px] text-discord-muted italic">Personne en ligne...</p>
              )}
            </div>
          </div>
          
          {/* Daily Reward Small */}
          <div className="glass-card border-discord-success/10 py-4">
             <div className="flex items-center justify-between gap-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-discord-success/20 rounded-xl flex items-center justify-center">
                    <Gift className="w-5 h-5 text-discord-success" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest">Daily</p>
                    <p className="text-sm font-black text-white">50 €</p>
                 </div>
               </div>
               <button 
                 onClick={handleClaimDaily}
                 disabled={!canClaimDaily() || claiming}
                 className={clsx(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   canClaimDaily() ? "bg-discord-success text-discord-darker hover:scale-105 shadow-lg shadow-discord-success/20" : "bg-white/5 text-discord-muted opacity-50"
                 )}
               >
                 {claiming ? "..." : canClaimDaily() ? "Réclamer" : "Pris"}
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Stats, Activity & Survival */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-discord-muted uppercase tracking-[0.2em] px-2">État Physique (Survie)</h3>
          <div className="glass-card p-4 space-y-3">
            {[
              { id: 'health',  icon: '❤️', label: 'Santé',       value: profile?.health  ?? 100, color: 'bg-discord-error' },
              { id: 'hunger',  icon: '🍔', label: 'Faim',        value: profile?.hunger  ?? 100, color: 'bg-orange-500' },
              { id: 'thirst',  icon: '💧', label: 'Soif',        value: profile?.thirst  ?? 100, color: 'bg-blue-400' },
              { id: 'fatigue', icon: '😴', label: 'Fatigue',     value: profile?.fatigue ?? 100, color: 'bg-indigo-400' },
              { id: 'hygiene', icon: '🧴', label: 'Hygiène',     value: profile?.hygiene ?? 100, color: 'bg-teal-400' },
              { id: 'alcohol', icon: '🍺', label: 'Alcoolémie',  value: profile?.alcohol ?? 0,   color: 'bg-green-500', max: 100 }
            ].map(stat => (
              <div key={stat.id} className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-white">{stat.icon} {stat.label}</span>
                  <span className="text-[10px] font-bold text-discord-muted">{stat.value}/{stat.max || 100}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.color} transition-all duration-1000`} 
                    style={{ width: `${Math.min(100, Math.max(0, (stat.value / (stat.max || 100)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-black text-discord-muted uppercase tracking-[0.2em] px-2 mt-8">Classement (Top Fortune)</h3>
          <div className="glass-card p-0 overflow-hidden border-[#FEE75C33]">
            {socialData.leaderboard.map((user, i) => (
              <div 
                key={user.id} 
                className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
              >
                <div className="w-6 text-[10px] font-black text-discord-muted">{i + 1}.</div>
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <Image 
                    src={user.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                    alt={user.username} width={32} height={32} className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.nickname_rp || user.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-[#FEE75C]">{user.balance.toLocaleString()} €</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-discord-muted uppercase tracking-[0.2em] px-2 flex items-center justify-between">
            Activité récente
            <Link href="/bank" className="text-discord-blurple hover:underline normal-case tracking-normal text-[11px]">Voir tout</Link>
          </h3>
          <div className="glass-card p-2 space-y-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group">
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    tx.amount > 0 ? "bg-discord-success/20 text-discord-success" : "bg-discord-error/20 text-discord-error"
                  )}>
                    {tx.amount > 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{tx.description}</p>
                    <p className="text-[10px] font-bold text-discord-muted uppercase tracking-widest">
                      {new Date(tx.created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={clsx(
                      "text-sm font-black",
                      tx.amount > 0 ? "text-discord-success" : "text-discord-error"
                    )}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(0)} €
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-discord-muted text-sm font-medium">Aucune activité récente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
