'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Wallet, Globe, Dices,
  ShoppingCart, Shield, LogOut, Moon, Settings,
  ChevronRight, User, BookOpen, ExternalLink, MessageCircle, Heart, Utensils, Landmark, Menu, X, ShoppingBag, Calendar
} from 'lucide-react'
import clsx from 'clsx'
import SettingsModal from './SettingsModal'

import { useLanguage } from '@/context/LanguageContext'
import NotificationCenter from './NotificationCenter'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', emoji: '🏠' },
  { href: '/bank', icon: Wallet, labelKey: 'nav.bank', emoji: '💰' },
  { href: '/social', icon: Globe, labelKey: 'nav.social', emoji: '🌐' },
  { href: '/messages', icon: MessageCircle, labelKey: 'nav.messages', emoji: '💬' },
  { href: '/dating', icon: Heart, labelKey: 'nav.dating', emoji: '💖' },
  { href: '/cantine', icon: Utensils, labelKey: 'nav.cantine', emoji: '🍱' },
  { href: '/absences', icon: Calendar, labelKey: 'nav.absences', emoji: '📅' },
  { href: '/impots', icon: Landmark, labelKey: 'nav.impots', emoji: '🧾' },
  { href: '/casino', icon: Dices, labelKey: 'nav.casino', emoji: '🎰' },
  { href: '/market', icon: ShoppingBag, labelKey: 'nav.market', emoji: '🛍️' },
  { href: '/shop', icon: ShoppingCart, labelKey: 'nav.shop', emoji: '🛒' },
]

const ADMIN_NAV = [
  { href: '/admin', icon: Shield, labelKey: 'nav.admin', emoji: '⚙️' },
]

// Status dot color from discord_status
function statusColor(s?: string | null) {
  switch (s) {
    case 'online': return '#57F287'
    case 'idle': return '#FEE75C'
    case 'dnd': return '#ED4245'
    default: return '#8D9299'
  }
}

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, roles, signOut } = useAuth()
  const { t } = useLanguage()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Admin check: env-hardcoded IDs handled server-side; here we just check DB roles
  const isAdmin = roles.some(r => r.name === 'admin')

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread')
        const data = await res.json()
        setUnreadCount(data.count || 0)
      } catch (e) {}
    }
    checkUnread()
    const int = setInterval(checkUnread, 30000)
    return () => clearInterval(int)
  }, [])

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden animate-fadeIn" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={clsx(
        "fixed left-0 top-0 bottom-[68px] md:bottom-0 w-[280px] flex flex-col z-[100] transition-transform duration-500 ease-out md:translate-x-0 shadow-2xl sidebar-transition",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}
        style={{ 
          background: 'var(--sidebar-bg, rgba(15, 16, 19, 0.95))', 
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255,255,255,0.08)' 
        }}>

      {/* ── Logo + Notifications ─────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#5865F2,#4752C4)', boxShadow: '0 4px 15px rgba(88,101,242,0.4)' }}>
            <Image
              src="/logo.png" alt="LunaVerse"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white leading-none tracking-tight">LunaVerse</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#8D9299' }}>ENT Scolaire RP</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationCenter />
          
          {/* Close Button Mobile */}
          <button 
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="mx-4 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* ── Navigation (scrollable) ───────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar no-scrollbar">

        {/* Main nav */}
        <div className="space-y-0.5">
          {NAV.map((item, i) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative',
                  active
                    ? 'text-white'
                    : 'text-discord-muted hover:text-white'
                )}
                style={active ? {
                  background: 'rgba(88,101,242,0.15)',
                  color: 'white',
                } : undefined}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: '#5865F2' }} />
                )}
                <div className={clsx(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors relative',
                  active
                    ? 'bg-discord-blurple/20'
                    : 'bg-white/5 group-hover:bg-white/10'
                )}>
                  <Icon className="w-4 h-4" style={{ color: active ? '#5865F2' : 'inherit' }} />
                  {item.href === '/messages' && unreadCount > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-discord-error rounded-full border-2 border-[#121316] animate-pulse" />
                  )}
                </div>
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </div>

        {/* PRONOTE direct link */}
        <div className="mt-2">
          <a
            href={process.env.NEXT_PUBLIC_PRONOTE_URL || 'https://prn-26.rededuc.fr/'}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all w-full group',
              'text-discord-muted hover:text-white'
            )}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 group-hover:bg-white/10 transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="flex-1 text-left">Pronote</span>
            <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div className="mt-4">
            <p className="px-3 mb-1 text-[10px] font-black uppercase tracking-widest" style={{ color: '#8D9299' }}>
              Administration
            </p>
            {ADMIN_NAV.map(item => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative group',
                    active ? 'text-white' : 'text-discord-muted hover:text-white'
                  )}
                  style={active ? { background: 'rgba(237,66,69,0.12)', color: 'white' } : undefined}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: '#ED4245' }} />
                  )}
                  <div className={clsx(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                    active ? 'bg-discord-error/20' : 'bg-white/5 group-hover:bg-white/10'
                  )}>
                    <Icon className="w-4 h-4" style={{ color: active ? '#ED4245' : 'inherit' }} />
                  </div>
                  <span>{t(item.labelKey)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="mx-4 mt-2 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* ── User card + Logout ────────────────────────────────── */}
      <div className="px-3 py-3 flex-shrink-0 space-y-1">

        {/* Profile link */}
        {profile ? (
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          >
            {/* Avatar + status */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-discord-blurple/30">
                <Image
                  src={profile.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={profile.username} width={36} height={36} className="object-cover w-full h-full"
                />
              </div>
              {/* Status dot */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                style={{
                  background: statusColor((profile as any)?.discord_status),
                  borderColor: 'rgb(18,19,22)',
                }}
              />
            </div>

            {/* Name + balance */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-none">{profile.username}</p>
              <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: '#57F287' }}>
                {(profile.balance ?? 0).toFixed(0)} €
              </p>
            </div>

            <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: '#8D9299' }} />
          </Link>
        ) : (
          /* Skeleton */
          <div className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
            <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded w-24" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="h-2.5 rounded w-16" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </div>
        )}

        {/* Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-semibold transition-all group"
          style={{ color: '#8D9299' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(88,101,242,0.08)'
            e.currentTarget.style.color = '#5865F2'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = ''
            e.currentTarget.style.color = '#8D9299'
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Settings className="w-4 h-4" />
          </div>
          <span>Paramètres</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-semibold transition-all group"
          style={{ color: '#8D9299' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(237,66,69,0.08)'
            e.currentTarget.style.color = '#ED4245'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = ''
            e.currentTarget.style.color = '#8D9299'
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <LogOut className="w-4 h-4" />
          </div>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around px-2 py-1 gap-1"
        style={{ 
          height: 'calc(68px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(18,19,22,0.98)', 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}>
        
        {NAV.slice(0, 4).map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 h-[52px] rounded-xl transition-all',
                active ? 'text-white' : 'text-discord-muted hover:text-white'
              )}
              style={active ? { background: 'rgba(88,101,242,0.15)' } : undefined}
            >
              <Icon className="w-5 h-5" style={{ color: active ? '#5865F2' : 'inherit' }} />
            </Link>
          )
        })}

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={clsx(
            'flex flex-col items-center justify-center flex-1 h-[52px] rounded-xl transition-all',
            isMobileMenuOpen ? 'text-white' : 'text-discord-muted hover:text-white'
          )}
          style={isMobileMenuOpen ? { background: 'rgba(88,101,242,0.15)' } : undefined}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" style={{ color: '#5865F2' }} />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </nav>
    </>
  )
}
