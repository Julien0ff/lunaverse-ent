'use client'

import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
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
  const { t } = useLanguage()
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
      
      // Update site activity
      fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_seen_at: new Date().toISOString() })
      })
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
        setMessage({ type: 'success', text: t('dashboard.reward_success') })
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div className="animate-slideIn">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight leading-none drop-shadow-sm">
            {t('dashboard.greeting')}{profile?.username ? <>, <span className="text-transparent bg-clip-text bg-gradient-to-r from-discord-blurple to-fuchsia-500 drop-shadow-[0_0_10px_rgba(88,101,242,0.5)]">{profile.username}</span></> : ''} !
          </h1>
          <p className="text-discord-muted mt-2 font-medium text-lg tracking-wide uppercase">{t('dashboard.welcome_back')}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card - Premium Credit Card Style */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(88,101,242,0.15)] group min-h-[280px] flex flex-col justify-between border border-white/10 p-8 transition-transform hover:scale-[1.01] duration-500">
          {/* Card Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#1a1c23] to-[#2a2d3a] -z-10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-discord-blurple/20 via-transparent to-fuchsia-500/10 opacity-50 -z-10" />
          {/* Glossy reflection */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-30 pointer-events-none -z-10" />
          
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 group-hover:rotate-[15deg] group-hover:scale-110 duration-700">
            <Wallet className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-5 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-sm" />
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em]">{t('dashboard.balance_label')}</p>
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-white tracking-tighter drop-shadow-md flex items-baseline gap-2">
              {profile?.balance.toLocaleString()} <span className="text-3xl text-discord-blurple">€</span>
            </h2>
          </div>

          <div className="relative z-10 flex gap-4 mt-8">
            <Link href="/bank" className="btn bg-discord-blurple hover:bg-[#4752C4] text-white flex-1 py-4 text-lg rounded-2xl shadow-[0_0_20px_rgba(88,101,242,0.3)] hover:shadow-[0_0_30px_rgba(88,101,242,0.5)] transition-all">
              <ArrowUpRight className="w-5 h-5" />
              {t('dashboard.transfer')}
            </Link>
            <Link href="/bank" className="btn bg-white/5 hover:bg-white/10 text-white flex-1 py-4 text-lg rounded-2xl border border-white/10 backdrop-blur-md transition-all">
              <History className="w-5 h-5" />
              {t('dashboard.history')}
            </Link>
          </div>
        </div>

        {/* Online Users */}
        <div className="flex flex-col gap-4">
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest mb-5 flex items-center gap-2">
              <Users className="w-4 h-4 text-discord-blurple drop-shadow-[0_0_5px_rgba(88,101,242,0.8)]" />
              {t('dashboard.online_users').replace('{count}', socialData.onlineUsers.length.toString())}
            </h3>
            <div className="flex flex-wrap gap-3">
              {socialData.onlineUsers.length > 0 ? socialData.onlineUsers.map(u => (
                <Link 
                  key={u.id} 
                  href={`/messages?chat=${u.username}`}
                  className="group relative"
                >
                  <div className="w-10 h-10 rounded-[14px] overflow-hidden ring-2 ring-white/5 group-hover:ring-discord-blurple/80 group-hover:shadow-[0_0_15px_rgba(88,101,242,0.5)] transition-all duration-300">
                    <Image 
                      src={u.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                      alt={u.username} width={40} height={40} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-discord-success rounded-full border-[3px] border-[#121316] shadow-[0_0_8px_rgba(87,242,135,0.6)]" />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-black rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-all shadow-xl whitespace-nowrap z-50">
                    {u.nickname_rp || u.username}
                  </div>
                </Link>
              )) : (
                <p className="text-xs text-discord-muted italic bg-white/5 px-4 py-2 rounded-xl border border-white/5">{t('dashboard.alone')}</p>
              )}
            </div>
          </div>
          
          {/* Daily Reward Small */}
          <div className="bg-gradient-to-r from-discord-success/5 to-transparent backdrop-blur-xl border border-discord-success/20 rounded-[2rem] p-5 shadow-[0_10px_30px_rgba(87,242,135,0.05)] relative overflow-hidden group">
             <div className="absolute inset-0 bg-discord-success/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="relative flex items-center justify-between gap-3 z-10">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-discord-success/10 border border-discord-success/30 rounded-[14px] flex items-center justify-center group-hover:bg-discord-success transition-colors duration-500 shadow-[0_0_15px_rgba(87,242,135,0.2)]">
                    <Gift className="w-6 h-6 text-discord-success group-hover:text-black transition-colors" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-discord-success/70 uppercase tracking-widest">{t('dashboard.daily_reward')}</p>
                    <p className="text-base font-black text-white">50 €</p>
                 </div>
               </div>
               <button 
                 onClick={handleClaimDaily}
                 disabled={!canClaimDaily() || claiming}
                 className={clsx(
                   "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                   canClaimDaily() ? "bg-discord-success text-black hover:scale-105 shadow-[0_0_20px_rgba(87,242,135,0.4)]" : "bg-white/5 text-discord-muted opacity-50 border border-white/5"
                 )}
               >
                 {claiming ? "..." : canClaimDaily() ? t('dashboard.claim') : t('dashboard.claimed')}
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Stats, Activity & Survival */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2 mt-8 mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FEE75C] drop-shadow-[0_0_5px_rgba(254,231,92,0.8)]" />
            {t('dashboard.leaderboard')}
          </h3>
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-0 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            {socialData.leaderboard.map((user, i) => (
              <div 
                key={user.id} 
                className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
              >
                <div className="w-6 text-sm font-black text-gray-500 group-hover:text-white transition-colors">{i + 1}.</div>
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/5 group-hover:ring-[#FEE75C]/50 transition-all">
                  <Image 
                    src={user.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                    alt={user.username} width={40} height={40} className="object-cover w-full h-full group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.nickname_rp || user.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#FEE75C] drop-shadow-[0_0_8px_rgba(254,231,92,0.3)]">{user.balance.toLocaleString()} €</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
            {t('dashboard.recent_activity')}
            <Link href="/bank" className="text-discord-blurple hover:text-[#5865F2] hover:underline normal-case tracking-normal text-[11px] font-bold transition-colors">{t('dashboard.see_all')}</Link>
          </h3>
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.25rem] transition-colors group">
                  <div className={clsx(
                    "w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm",
                    tx.amount > 0 ? "bg-discord-success/10 text-discord-success border border-discord-success/20 group-hover:bg-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20 group-hover:bg-discord-error/20"
                  )}>
                    {tx.amount > 0 ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-discord-blurple transition-colors">{tx.description}</p>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                      {new Date(tx.created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={clsx(
                      "text-base font-black drop-shadow-sm",
                      tx.amount > 0 ? "text-discord-success" : "text-discord-error"
                    )}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} €
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-discord-muted" />
                </div>
                <p className="text-gray-400 text-sm font-medium">{t('dashboard.no_activity')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
