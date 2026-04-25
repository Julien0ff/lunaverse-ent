'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import { User, Wallet, Calendar, MessageCircle, ShoppingBag, Gamepad2, Trophy, Edit3, Save, Twitter, Instagram, Github, Link as LinkIcon, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

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
  const [editing, setEditing] = useState(false)
  const [editBio, setEditBio] = useState('')
  const [editSocials, setEditSocials] = useState({
    twitter: '', instagram: '', github: '', website: ''
  })
  const [saving, setSaving] = useState(false)

  // Discord status from DB (updated by bot presenceUpdate)
  const status = resolveStatus((profile as any)?.discord_status)

  useEffect(() => {
    if (!profile) return
    const p = profile as any
    fetch('/api/profile/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .finally(() => setLoading(false))

    setEditBio(p.bio || '')
    setEditSocials({
      twitter: p.twitter_url || '',
      instagram: p.instagram_url || '',
      github: p.github_url || '',
      website: p.website_url || ''
    })
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editBio,
          twitter_url: editSocials.twitter,
          instagram_url: editSocials.instagram,
          github_url: editSocials.github,
          website_url: editSocials.website
        })
      })
      if (res.ok) {
        setEditing(false)
        window.location.reload()
      }
    } catch (e) {}
    setSaving(false)
  }

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
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black px-3 py-1.5 rounded-full border shadow-xl transition-all duration-300 group-hover:scale-110"
              style={{
                background: `${status.color}33`,
                color: '#FFFFFF',
                borderColor: `${status.color}60`,
                backdropFilter: 'blur(8px)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: status.color }} />
                {status.label}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left mt-6 md:mt-0 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h2 className="text-4xl font-black text-white tracking-tight group-hover:text-discord-blurple transition-colors">
                {profile?.username || '…'}
              </h2>
              {roles.some(r => r.name === 'Admin') && (
                <span className="bg-discord-blurple/20 text-discord-blurple text-[10px] font-black px-2 py-0.5 rounded-md border border-discord-blurple/30 uppercase tracking-widest w-fit mx-auto md:mx-0">
                  Staff
                </span>
              )}
            </div>
            
            {/* RP Identity */}
            {(profile as any)?.nickname_rp && (
              <div className="mb-4 animate-fadeIn flex items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-black text-discord-muted uppercase tracking-[0.2em]">Identité RP :</span>
                <span className="text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
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

      {/* Bio & Socials */}
      <div className="glass-card animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-discord-blurple" />
            Biographie & Réseaux
          </h3>
          <button 
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
              editing ? "bg-discord-success text-white" : "bg-white/5 text-discord-muted hover:text-white hover:bg-white/10"
            )}
          >
            {editing ? (saving ? '...' : <><Save size={14} /> Enregistrer</>) : <><Edit3 size={14} /> Modifier</>}
          </button>
        </div>

        {editing ? (
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-2 block">Bio</label>
              <textarea 
                className="glass-input min-h-[100px] py-4"
                placeholder="Dites-en un peu plus sur vous..."
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'twitter', icon: Twitter, label: 'Twitter URL' },
                { key: 'instagram', icon: Instagram, label: 'Instagram URL' },
                { key: 'github', icon: Github, label: 'GitHub URL' },
                { key: 'website', icon: LinkIcon, label: 'Site Web' },
              ].map(social => (
                <div key={social.key}>
                  <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-2 block">{social.label}</label>
                  <div className="relative">
                    <social.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-muted" />
                    <input 
                      type="text" 
                      className="glass-input !pl-12"
                      placeholder="https://..."
                      value={(editSocials as any)[social.key]}
                      onChange={e => setEditSocials(prev => ({ ...prev, [social.key]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap italic">
                {(profile as any)?.bio || "Aucune biographie définie pour le moment."}
              </p>
            </div>
            <div className="w-full md:w-64 space-y-2">
              {[
                { url: (profile as any)?.twitter_url, icon: Twitter, label: 'Twitter', color: '#1DA1F2' },
                { url: (profile as any)?.instagram_url, icon: Instagram, label: 'Instagram', color: '#E4405F' },
                { url: (profile as any)?.github_url, icon: Github, label: 'GitHub', color: '#FFFFFF' },
                { url: (profile as any)?.website_url, icon: LinkIcon, label: 'Site Web', color: '#5865F2' },
              ].filter(s => s.url).map((social, i) => (
                <a 
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/2 hover:bg-white/5 border border-white/5 transition-all group"
                >
                  <social.icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: social.color }} />
                  <span className="text-xs font-bold text-white flex-1">{social.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-20 group-hover:opacity-100" />
                </a>
              ))}
              {![(profile as any)?.twitter_url, (profile as any)?.instagram_url, (profile as any)?.github_url, (profile as any)?.website_url].some(u => u) && (
                <p className="text-[10px] text-discord-muted italic">Aucun lien social.</p>
              )}
            </div>
          </div>
        )}
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
