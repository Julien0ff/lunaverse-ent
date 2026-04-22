'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  discord_id: string
  username: string
  avatar_url: string | null
  balance: number
  last_daily: string | null
  last_salary: string | null
  // Survival stats — column names match Discord bot
  health?: number
  hunger?: number
  thirst?: number
  fatigue?: number
  hygiene?: number
  alcohol?: number
  // Dating
  dating_photo_url?: string | null
  dating_bio?: string | null
  // Cantine
  canteen_subscription?: string
  canteen_subscription_end?: string
  notifications_enabled?: boolean
  created_at?: string
  updated_at?: string
}


interface Role {
  id: string
  name: string
  discord_role_id: string
  salary_amount: number
  pocket_money: number
  color: string
  can_connect: boolean
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  roles: Role[]
  loading: boolean
  ready: boolean // true once BOTH profile and roles have loaded
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  supabase: typeof supabase
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Build a fallback profile from Discord OAuth metadata.
 * Used when the DB profile cannot be created/read (RLS issues).
 */
function buildFallbackProfile(user: User): Profile {
  const meta = user.user_metadata || {}
  return {
    id: user.id,
    discord_id: meta.provider_id || meta.sub || user.id,
    username:
      meta.custom_claims?.global_name ||
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      meta.preferred_username ||
      user.email?.split('@')[0] ||
      'Joueur',
    avatar_url: meta.avatar_url || null,
    balance: 0,
    last_daily: null,
    last_salary: null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false) // true after BOTH profile + roles loaded

  const refreshProfile = useCallback(async () => {
    // Only set ready to false if we haven't loaded anything yet
    // Removed setReady(false) to prevent flicker on session refresh
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) { setReady(true); return }

      // 1. Try server-side upsert (handles RLS correctly with session cookie)
      let resolvedProfile: Profile | null = null
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        credentials: 'include', // send session cookies to API route
      })
      if (res.ok) {
        const { profile: serverProfile } = await res.json()
        resolvedProfile = serverProfile || buildFallbackProfile(currentUser)
      } else {
        // 2. API failed (likely RLS) → try direct SELECT (read-only, usually allowed)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle()

        if (existingProfile) {
          resolvedProfile = existingProfile
        } else {
          console.warn('Using Discord metadata fallback profile (RLS may need fixing).')
          resolvedProfile = buildFallbackProfile(currentUser)
        }
      }

      // 2. Fetch roles — query Supabase directly (client has valid session, no cookie issues)
      let resolvedRoles: Role[] = []
      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role:roles (*)')
          .eq('user_id', currentUser.id)

        resolvedRoles = (userRoles || []).map((ur: any) => ur.role).filter(Boolean)

        // Super admin injection
        const superAdminIds = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
        const discordId = currentUser.user_metadata?.provider_id || currentUser.user_metadata?.sub || ''
        if (superAdminIds.includes(discordId) && !resolvedRoles.some(r => r.name === 'admin')) {
          resolvedRoles.push({
            id: 'super-admin-virtual-id',
            name: 'admin',
            discord_role_id: '',
            salary_amount: 0,
            pocket_money: 0,
            color: '#FF0000',
            can_connect: true,
          })
        }
      } catch (e) {
        console.error('Error fetching roles:', e)
      }

      // 3. Set everything at once → single React render → no race
      setProfile(resolvedProfile)
      setRoles(resolvedRoles)
      setReady(true)

    } catch (err) {
      console.error('Error in refreshProfile:', err)
      setReady(true) // unblock even on error
    }
  }, []) // Removed profile dependency to avoid infinite loop

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        refreshProfile().finally(() => setLoading(false))
      } else {
        setProfile(null)
        setRoles([])
        setReady(true)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [refreshProfile]) // Re-added refreshProfile now that it is memoized

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, ready, signIn, signOut, refreshProfile, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
