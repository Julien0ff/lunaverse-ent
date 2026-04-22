'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import { User, Wallet, Calendar, MessageCircle, ShoppingBag, Gamepad2, Trophy } from 'lucide-react'

interface Stats {
  posts: number; likesReceived: number; purchases: number
  casinoWins: number; totalWon: number; totalLost: number
  partnerName: string | null; coupleSince: string | null
}

interface DiscordStatus { label: string; color: string }

/**
 * Resolves a Discord presence status to a human-readable label + color.
 * The `discord_status` column is updated by the bot via presenceUpdate events.
 * Requires: profiles table to have `discord_status VARCHAR` column.
 */
function resolveStatus(s?: string | null): DiscordStatus {
  switch (s) {
    case 'online': return { label: '● En ligne', color: '#57F287' }
    case 'idle': return { label: '◔ Absent', color: '#FEE75C' }
    case 'dnd': return { label: '⊘ Ne pas déranger', color: '#ED4245' }
    default: return { label: '○ Hors ligne', color: '#8D9299' }
  }
}

export default function ProfilePage() {
  const { profile, roles, user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    posts: 0, likesReceived: 0, purchases: 0, casinoWins: 0, totalWon: 0, totalLost: 0,
    partnerName: null, coupleSince: null
  })
  const [loading, setLoading] = useState(true)

  // Discord status from DB (updated by bot presenceUpdate)
  const status = resolveStatus((profile as any)?.discord_status)

  useEffect(() => {
    if (!profile) return
    fetch('/api/profile/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .finally(() => setLoading(false))
  }, [profile])

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : user?.created_at
      ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : null

  return (
    <div className="page-container">
      {/* Header */}
      <div className="animate-slideIn">
        <h1 className="text-4xl font-black text-white tracking-tight">Mon Profil</h1>
        <p className="text-discord-muted mt-1 font-medium">Votre identité LunaVerse.</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card overflow-hidden relative group" style={{ borderColor: 'rgba(88,101,242,0.15)' }}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
          <User className="w-40 h-40 text-discord-blurple" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 relative rounded-3xl overflow-hidden ring-4 ring-discord-blurple/30 shadow-2xl shadow-discord-blurple/20 transition-transform duration-500 group-hover:scale-105">
              <Image
                src={profile?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={profile?.username || 'Avatar'} fill sizes="112px" className="object-cover"
              />
            </div>
            {/* Status badge */}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black px-2.5 py-1 rounded-full border"
              style={{
                background: `${status.color}18`,
                color: status.color,
                borderColor: `${status.color}40`,
              }}
            >
              {status.label}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left mt-4 md:mt-0 min-w-0">
            <h2 className="text-3xl font-black text-white mb-1 group-hover:text-discord-blurple transition-colors">
              {profile?.username || '…'}
            </h2>
            
            {/* RP Identity */}
            {(profile as any)?.nickname_rp && (
              <div className="mb-3 animate-fadeIn flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-black text-discord-muted uppercase tracking-[0.2em]">Identité RP :</span>
                <span className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                  {(profile as any).nickname_rp}
                </span>
              </div>
            )}

            {/* Couple Status */}
            {stats.partnerName && (
              <div className="mb-3 animate-fadeIn flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-black text-discord-muted uppercase tracking-[0.2em]">Relation :</span>
                <span className="text-sm font-bold text-white bg-discord-blurple/20 px-3 py-1 rounded-lg border border-discord-blurple/30 flex items-center gap-1.5 shadow-sm shadow-discord-blurple/10">
                  💖 En couple avec <strong className="text-discord-blurple drop-shadow-md">{stats.partnerName}</strong>
                </span>
              </div>
            )}

            {/* Roles */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              {roles.length > 0 ? roles.map(role => (
                <span
                  key={role.id}
                  className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider"
                  style={{
                    background: `${role.color || '#5865F2'}22`,
                    color: role.color || '#5865F2',
                    border: `1px solid ${role.color || '#5865F2'}40`,
                  }}
                >
                  {role.name}
                </span>
              )) : (
                <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/5 text-discord-muted border border-white/8">
                  Aucun rôle assigné
                </span>
              )}
            </div>

            {memberSince && (
              <p className="text-discord-muted text-sm flex items-center justify-center md:justify-start gap-2">
                <Calendar className="w-4 h-4" />
                Membre depuis {memberSince}
              </p>
            )}
          </div>

          {/* Balance */}
          <div className="flex-shrink-0 text-center p-6 rounded-3xl border"
            style={{ background: 'rgba(88,101,242,0.08)', borderColor: 'rgba(88,101,242,0.2)' }}>
            <Wallet className="w-6 h-6 mx-auto mb-2" style={{ color: '#5865F2' }} />
            <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Solde</p>
            <p className="text-3xl font-black text-white">
              {(profile?.balance ?? 0).toFixed(0)}<span className="text-lg ml-1" style={{ color: '#5865F2' }}>€</span>
            </p>
          </div>
        </div>
      </div>

      {/* Salary info — only if roles have salary */}
      {roles.some(r => (r as any).salary_amount > 0 || (r as any).pocket_money > 0) && (
        <div className="glass-card animate-fadeIn" style={{ borderColor: 'rgba(87,242,135,0.15)' }}>
          <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-discord-success" />
            Revenus hebdomadaires
          </h3>
          <div className="flex flex-wrap gap-4 items-center">
            {roles.filter(r => (r as any).salary_amount > 0).map(r => (
              <div key={r.id + 'sal'} className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-lg font-bold"
                  style={{ background: `${r.color || '#5865F2'}20`, color: r.color || '#5865F2' }}>
                  💼 Salaire · {r.name}
                </span>
                <span className="font-black text-discord-success">{(r as any).salary_amount} €</span>
              </div>
            ))}
            {roles.filter(r => (r as any).pocket_money > 0).map(r => (
              <div key={r.id + 'pock'} className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-lg font-bold"
                  style={{ background: `${r.color || '#5865F2'}20`, color: r.color || '#5865F2' }}>
                  🎒 Argent de poche · {r.name}
                </span>
                <span className="font-black" style={{ color: '#FEE75C' }}>{(r as any).pocket_money} €</span>
              </div>
            ))}
            <div className="ml-auto text-right">
              <p className="text-[10px] text-discord-muted uppercase tracking-widest">Prochain versement</p>
              <p className="text-sm font-black text-white">
                {(profile as any)?.last_salary
                  ? (() => {
                    const next = new Date((profile as any).last_salary)
                    next.setDate(next.getDate() + 7)
                    return next > new Date()
                      ? `Lundi ${next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                      : '✅ Disponible'
                  })()
                  : '✅ Disponible'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { icon: MessageCircle, label: 'Posts créés', value: stats.posts, hex: '#5865F2' },
          { icon: ShoppingBag, label: 'Achats effectués', value: stats.purchases, hex: '#57F287' },
          { icon: Gamepad2, label: 'Victoires casino', value: stats.casinoWins, hex: '#FEE75C' },
          { icon: Trophy, label: 'Gains totaux', value: `${stats.totalWon.toFixed(0)} €`, hex: '#57F287' },
        ] as const).map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className="glass-card group hover:scale-[1.03] transition-transform cursor-default animate-fadeIn"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
                style={{ background: `${stat.hex}18` }}>
                <Icon className="w-5 h-5" style={{ color: stat.hex }} />
              </div>
              <p className="text-2xl font-black text-white">
                {loading
                  ? <span className="inline-block w-14 h-7 bg-white/10 rounded-lg animate-pulse" />
                  : stat.value
                }
              </p>
              <p className="text-[10px] font-bold text-discord-muted uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Discord Info */}
      <div className="glass-card animate-fadeIn">
        <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-discord-blurple" />
          Informations Discord
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Nom d'utilisateur", value: profile?.username },
            { label: 'Discord ID', value: profile?.discord_id },
            {
              label: 'Dernière activité', value: (profile as any)?.updated_at
                ? new Date((profile as any).updated_at).toLocaleString('fr-FR')
                : "Aujourd'hui"
            },
          ].map((info, i) => (
            <div key={i} className="p-3 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">{info.label}</p>
              <p className="text-white font-bold text-sm truncate">{info.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
