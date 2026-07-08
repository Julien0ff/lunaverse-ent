import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { Alert } from 'react-native'

interface Profile {
  id: string
  discord_id: string
  username: string
  avatar_url: string | null
  balance: number
  last_daily: string | null
  last_salary: string | null
  health?: number
  hunger?: number
  thirst?: number
  fatigue?: number
  hygiene?: number
  alcohol?: number
  nickname_rp?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (profileData) {
        setProfile(profileData)
      } else {
        // Build minimal fallback from Discord metadata
        const meta = currentUser.user_metadata || {}
        setProfile({
          id: currentUser.id,
          discord_id: meta.provider_id || meta.sub || currentUser.id,
          username: meta.custom_claims?.global_name || meta.full_name || meta.name || 'Joueur',
          avatar_url: meta.avatar_url || null,
          balance: 0,
          last_daily: null,
          last_salary: null,
        })
      }
    } catch (err) {
      console.error('Error refreshing profile:', err)
    }
  }, [])

  useEffect(() => {
    // 1. Restore existing session from secure storage
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession)
      setUser(existingSession?.user ?? null)
      if (existingSession?.user) {
        refreshProfile().finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          refreshProfile().finally(() => setLoading(false))
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [refreshProfile])

  const signIn = async () => {
    try {
      const redirectUrl = Linking.createURL('auth/callback')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error

      if (data?.url) {
        // Open in system browser for OAuth flow
        await Linking.openURL(data.url)
      }
    } catch (err: any) {
      console.error('Sign in error:', err)
      Alert.alert('Erreur de connexion', err.message || 'Impossible de se connecter avec Discord.')
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
    } catch (err: any) {
      console.error('Sign out error:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
