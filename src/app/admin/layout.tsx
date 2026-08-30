'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Shield, Users, Wallet, ShoppingCart, Key,
  Utensils, FileText, Calendar, Megaphone,
  CreditCard, Loader2
} from 'lucide-react'
import clsx from 'clsx'

const ADMIN_PAGES = [
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/finances', label: 'Finances', icon: Wallet },
  { href: '/admin/primes', label: 'Bourse & Primes', icon: CreditCard },
  { href: '/admin/shop', label: 'Boutique', icon: ShoppingCart },
  { href: '/admin/roles', label: 'Rôles & Salaires', icon: Key },
  { href: '/admin/cantine', label: 'Cantine', icon: Utensils },
  { href: '/admin/declarations', label: 'Déclarations', icon: FileText },
  { href: '/admin/inscriptions', label: 'Inscriptions', icon: FileText },
  { href: '/admin/options', label: 'Spécialités', icon: FileText },
  { href: '/admin/absences', label: 'Absences', icon: Calendar },
  { href: '/admin/annonces', label: 'Annonces', icon: Megaphone },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { roles, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (authLoading) return
    const admin = roles.some(r => r.name === 'admin')
    if (!admin) {
      router.push('/dashboard')
    } else {
      setIsAdmin(true)
      setChecking(false)
    }
  }, [roles, authLoading, router])

  if (authLoading || checking) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>
  }

  if (!isAdmin) return null

  return (
    <div className="page-container max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-2">
        <div className="glass-card p-4 mb-4 bg-discord-error/10 border-discord-error/20 flex items-center gap-3">
          <Shield className="w-6 h-6 text-discord-error" />
          <div>
            <h2 className="font-black text-white text-lg leading-tight">Admin Panel</h2>
            <p className="text-[10px] uppercase tracking-widest text-discord-muted font-bold">Zone Sécurisée</p>
          </div>
        </div>
        
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {ADMIN_PAGES.map((page) => {
            const Icon = page.icon
            const active = pathname === page.href || pathname.startsWith(page.href + '/')
            return (
              <Link
                key={page.href}
                href={page.href}
                className={clsx(
                  "flex flex-shrink-0 items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  active 
                    ? "bg-discord-error text-white shadow-lg shadow-discord-error/20"
                    : "text-discord-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{page.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
