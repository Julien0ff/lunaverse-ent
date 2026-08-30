'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ShieldAlert, Users, Wallet, Dices, ShoppingCart,
  Plus, Pencil, Trash2, Send, RefreshCw, Search,
  ChevronDown, Check, X, Settings, BookOpen, Save, Clock,
  FileText, CheckCircle2, AlertCircle, Calendar, Paperclip, Home, Megaphone, Info
} from 'lucide-react'
import clsx from 'clsx'

const SUBJECTS = [
  'ALLEMAND', 'ANGLAIS', 'ARTS PLASTIQUES', 'BRANLETTE COLLECTIVE', 'CLUB (au choix)',
  'CRIMINOLOGIE', 'CUISINE', 'CYBERSÉCURITÉ', 'DROIT', 'DROIT CONSTITUTIONNEL DE LA VE RÉPUBLIQUE',
  'ÉDUCATION MORALE ET CIVIQUE', 'ÉDUCATION MUSICALE', 'ÉDUCATION PHYSIQUE ET SPORTIVE', 'ESPAGNOL',
  'EVENT', 'EXAMENS NATIONAUX', 'FORMATION HUMAINE', 'FRANÇAIS', 'Gestion Etab', 'HISTOIRE-GÉOGRAPHIE',
  'HYMNE', 'INFIRMERIE', 'MATHÉMATIQUES', 'Matière non désignée', 'Permanence', 'PHYSIQUE-CHIMIE',
  'PPMS', 'Prévention', 'Réservation de salle', 'SCIENCE DE LA VIE QUOTIDIENNE',
  'SCIENCES DE LA VIE ET DE LA TERRE', 'SCIENCES ÉCONOMIQUES ET SOCIALES', 'SORTIE SCOLAIRE',
  'TECHNOLOGIE', 'TP PHYSIQUE-CHIMIE', 'VIE POLITIQUE FRANÇAISE'
]

type AdminTab = 'users' | 'finances' | 'shop' | 'roles' | 'money' | 'suggestions' | 'cantine' | 'declarations' | 'absences' | 'maisons' | 'annonces'

interface AdminUser {
  id: string; discord_id: string; username: string
  avatar_url: string | null; balance: number; created_at: string
  pronote_id: string | null; nickname_rp?: string
  health: number; hunger: number; thirst: number; fatigue: number; hygiene: number; alcohol: number
  first_connection?: boolean
}
interface Suggestion {
  id: string; user_id: string; name: string; description: string | null
  category: string | null; estimated_price: number | null; status: 'pending' | 'approved'
  created_at: string; author: { username: string; avatar_url: string | null }
}
interface CanteenMenu {
  id: string; menu_date: string; time_start: string; time_end: string
  starter: string; main: string; side?: string; dessert: string; drink?: string; note: string
}
interface TaxRecord {
  id: string; user_id: string; reason: string; amount: number; is_preleve: boolean; is_paid: boolean
  target?: { username: string; discord_id: string }
}
interface ShopItem {
  id: string; name: string; description: string; price: number
  category: string; is_available: boolean
}
interface Role {
  id: string; name: string; discord_role_id: string
  salary_amount: number; pocket_money: number; color: string
  can_connect: boolean
}

export default function AdminPage() {
  const { profile, roles } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('users')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Data
  const [users, setUsers] = useState<AdminUser[]>([])
  const [taxes, setTaxes] = useState<TaxRecord[]>([])
  const [items, setItems] = useState<ShopItem[]>([])
  const [rolesList, setRolesList] = useState<Role[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [canteenMenus, setCanteenMenus] = useState<CanteenMenu[]>([])
  const [declarations, setDeclarations] = useState<any[]>([])
  const [absences, setAbsences] = useState<any[]>([])
  const [houses, setHouses] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])

  // Forms
  const [giveSelectedIds, setGiveSelectedIds] = useState<string[]>([])
  const [giveUserSearch, setGiveUserSearch] = useState('')
  const [givePickerOpen, setGivePickerOpen] = useState(false)
  const [giveAmount, setGiveAmount] = useState('')
  const [giveReason, setGiveReason] = useState('')
  const [giveAutoAdd, setGiveAutoAdd] = useState(false)
  const [newTax, setNewTax] = useState({ reason: '', amount: '', auto_deduct: false })
  const [taxSelectedIds, setTaxSelectedIds] = useState<string[]>([])
  const [taxUserSearch, setTaxUserSearch] = useState('')
  const [taxPickerOpen, setTaxPickerOpen] = useState(false)

  // Shop & Canteen forms
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: 'drinks', is_available: true })
  const [newCanteen, setNewCanteen] = useState({ 
    menu_date: new Date().toISOString().split('T')[0], time_start: '15:30', time_end: '16:00',
    starter: '', main: '', side: '', drink: '', dessert: '', note: ''
  })
  const [decProcessing, setDecProcessing] = useState<string | null>(null)
  const [penaltyMap, setPenaltyMap] = useState<Record<string, boolean>>({})

  // Announcements
  const [newCourse, setNewCourse] = useState({ target_class: 'nova', subject: '', teacher_id: '', date: '', time_start: '', time_end: '' })
  const [newInfo, setNewInfo] = useState({ target_class: 'both', subject: '', teacher_id: '', replacement_teacher_id: '', info_status: 'supprime', info_text: '', date: '', time_start: '' })

  // Inline nickname RP editing
  const [nicknameEditing, setNicknameEditing] = useState<string | null>(null)
  const [nicknameValue, setNicknameValue] = useState('')

  // Roles editing
  const [newRole, setNewRole] = useState({ name: '', discord_role_id: '', color: '#5865F2' })
  const isSuperAdmin = profile?.discord_id === process.env.NEXT_PUBLIC_ADMIN_DISCORD_ID

  // Survival stats editing
  const [statsEditing, setStatsEditing] = useState<string | null>(null)
  const [statsValues, setStatsValues] = useState<Record<string, number>>({})

  // Admin check
  const isAdmin = roles.some(r => r.name === 'admin')

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/dashboard')
  }, [isAdmin, loading, router])

  // Close pickers on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (taxPickerOpen && !target.closest('[data-tax-picker]')) setTaxPickerOpen(false)
      if (givePickerOpen && !target.closest('[data-give-picker]')) setGivePickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [taxPickerOpen, givePickerOpen])

  const loadAll = useCallback(async () => {
    await Promise.allSettled([
      loadUsers(), loadTaxes(), loadItems(), 
      loadRoles(), loadSuggestions(), loadCanteen(),
      loadDeclarations(), loadAbsences(), loadHouses(),
      loadAnnouncements()
    ])
  }, [])

  useEffect(() => {
    if (!profile) return
    setLoading(false)
    loadAll()
  }, [profile, loadAll])

  const loadUsers = async () => {
    const r = await fetch('/api/admin/users')
    if (r.ok) setUsers((await r.json()).users || [])
  }
  const loadTaxes = async () => {
    // Fait via API
    const r = await fetch('/api/admin/taxes')
    if (r.ok) setTaxes((await r.json()).taxes || [])
  }
  const loadItems = async () => {
    const r = await fetch('/api/shop/items')
    if (r.ok) setItems((await r.json()).items || [])
  }
  const loadRoles = async () => {
    const r = await fetch('/api/admin/roles')
    if (r.ok) setRolesList((await r.json()).roles || [])
  }
  const loadSuggestions = async () => {
    const r = await fetch('/api/admin/suggestions')
    if (r.ok) setSuggestions((await r.json()).suggestions || [])
  }
  const loadCanteen = async () => {
    const r = await fetch('/api/cantine/menu')
    if (r.ok) setCanteenMenus((await r.json()).menus || [])
  }
  const loadDeclarations = async () => {
    const r = await fetch('/api/admin/declarations')
    if (r.ok) setDeclarations((await r.json()).declarations || [])
  }
  const loadAbsences = async () => {
    const r = await fetch('/api/admin/absences')
    if (r.ok) setAbsences((await r.json()).items || [])
  }
  const loadHouses = async () => {
    const r = await fetch('/api/admin/houses')
    if (r.ok) setHouses((await r.json()).items || [])
  }
  const loadAnnouncements = async () => {
    const r = await fetch('/api/admin/announcements')
    if (r.ok) setAnnouncements((await r.json()).items || [])
  }

  const processAbsence = async (id: string, status: 'accepted' | 'refused') => {
    try {
      const res = await fetch('/api/admin/absences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        showMsg('success', `Absence ${status === 'accepted' ? 'validée' : 'refusée'}`)
        loadAbsences()
      } else {
        showMsg('error', (await res.json()).error)
      }
    } catch (e) {}
  }

  const processHouse = async (id: string, status: 'active' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/houses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        showMsg('success', `Maison ${status === 'active' ? 'validée' : 'refusée'}`)
        loadHouses()
      } else {
        showMsg('error', (await res.json()).error)
      }
    } catch (e) {}
  }

  const updateHouseFurnishing = async (houseId: string, dlcId: string, value: boolean) => {
    const house = houses.find(h => h.id === houseId)
    if (!house) return
    const newFurnishings = { ...(house.furnishings || {}) }
    newFurnishings[dlcId] = value
    
    try {
      const res = await fetch('/api/admin/houses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: houseId, furnishings: newFurnishings })
      })
      if (res.ok) {
        showMsg('success', 'DLC mis à jour')
        loadHouses()
      } else {
        showMsg('error', (await res.json()).error)
      }
    } catch (e) {}
  }

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const giveMoney = async () => {
    if (!giveSelectedIds.length || !giveAmount) return
    setLoading(true)
    try {
      let successCount = 0
      for (const targetId of giveSelectedIds) {
        // Find user by ID to get their discord_id or username
        const targetUser = users.find(u => u.id === targetId)
        if (!targetUser) continue

        const res = await fetch('/api/admin/give-money', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: targetUser.discord_id || targetUser.username,
            amount: giveAmount,
            reason: giveReason,
            auto_add: giveAutoAdd
          })
        })
        if (res.ok) successCount++
      }

      if (successCount > 0) {
        showMsg('success', `✅ Prime(s) envoyée(s) à ${successCount} utilisateur(s)`)
        setGiveSelectedIds([])
        setGiveAmount('')
        setGiveReason('')
        loadUsers()
      }
    } catch (err) {
      showMsg('error', 'Erreur lors de l\'envoi des primes')
    } finally {
      setLoading(false)
    }
  }

  const saveStats = async (userId: string) => {
    const values = {
      health: statsValues.health,
      hunger: statsValues.hunger,
      thirst: statsValues.thirst,
      fatigue: statsValues.fatigue,
      hygiene: statsValues.hygiene,
      alcohol: statsValues.alcohol
    }
    const r = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...values })
    })
    if (r.ok) { showMsg('success', 'Stats mises à jour'); setStatsEditing(null); loadUsers() }
    else showMsg('error', (await r.json()).error)
  }

  const toggleFirstConnection = async (userId: string, current: boolean) => {
    const r = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, first_connection: !current })
    })
    if (r.ok) { showMsg('success', !current ? 'Tutoriel activé pour ce joueur' : 'Tutoriel désactivé'); loadUsers() }
    else showMsg('error', (await r.json()).error)
  }

  const processDeclaration = async (declarationId: string, action: 'accept' | 'refuse') => {
    setDecProcessing(declarationId)
    const r = await fetch('/api/admin/declarations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ declarationId, action, hasPenalty: !!penaltyMap[declarationId] })
    })
    if (r.ok) {
      showMsg('success', action === 'accept' ? 'Déclaration acceptée ✅' : 'Déclaration refusée ❌')
      loadDeclarations()
      loadUsers()
    } else {
      showMsg('error', (await r.json()).error)
    }
    setDecProcessing(null)
    setPenaltyMap(prev => { const next = { ...prev }; delete next[declarationId]; return next })
  }

  const saveNicknameRp = async (userId: string) => {
    const r = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, nickname_rp: nicknameValue })
    })
    if (r.ok) { showMsg('success', 'Identité RP mise à jour'); setNicknameEditing(null); loadUsers() }
    else showMsg('error', (await r.json()).error)
  }

  const approveSuggestion = async (id: string) => {
    const r = await fetch('/api/admin/suggestions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'approve' })
    })
    if (r.ok) { showMsg('success', 'Suggestion approuvée ! 🎉'); loadSuggestions() }
  }

  const deleteSuggestion = async (id: string) => {
    const r = await fetch('/api/admin/suggestions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'delete' })
    })
    if (r.ok) { showMsg('success', 'Suggestion rejetée'); loadSuggestions() }
  }

  const createCanteenMenu = async () => {
    const r = await fetch('/api/cantine/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCanteen)
    })
    if (r.ok) {
      showMsg('success', 'Menu de cantine ajouté !')
      setNewCanteen({ menu_date: new Date().toISOString().split('T')[0], time_start: '15:30', time_end: '16:00', starter: '', main: '', side: '', drink: '', dessert: '', note: '' })
      loadCanteen()
    } else showMsg('error', (await r.json()).error)
  }

  const deleteCanteenMenu = async (id: string) => {
    const r = await fetch(`/api/cantine/menu?id=${id}`, { method: 'DELETE' })
    if (r.ok) { showMsg('success', 'Menu supprimé'); loadCanteen() }
  }

  const createAnnouncement = async () => {
    if (!newCourse.subject || !newCourse.date || !newCourse.time_start || !newCourse.time_end) {
      return showMsg('error', 'Veuillez remplir tous les champs obligatoires (matière, date, heure de début et de fin).')
    }
    const startTime = new Date(`${newCourse.date}T${newCourse.time_start}`).toISOString()
    const endTime = new Date(`${newCourse.date}T${newCourse.time_end}`).toISOString()
    
    const r = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'course',
        target_class: newCourse.target_class,
        subject: newCourse.subject,
        teacher_id: newCourse.teacher_id || null,
        start_time: startTime,
        end_time: endTime
      })
    })
    if (r.ok) {
      showMsg('success', 'Annonce de cours planifiée !')
      setNewCourse({ target_class: 'nova', subject: '', teacher_id: '', date: '', time_start: '', time_end: '' })
      loadAnnouncements()
    } else {
      showMsg('error', (await r.json()).error)
    }
  }

  const createInfoTrafic = async () => {
    if (!newInfo.info_status) {
      return showMsg('error', 'Veuillez sélectionner un statut.')
    }
    
    let startTime = null
    if (newInfo.date && newInfo.time_start) {
        startTime = new Date(`${newInfo.date}T${newInfo.time_start}`).toISOString()
    }
    
    const r = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'info',
        target_class: newInfo.target_class,
        subject: newInfo.subject || null,
        teacher_id: newInfo.teacher_id || null,
        replacement_teacher_id: newInfo.replacement_teacher_id || null,
        start_time: startTime,
        info_status: newInfo.info_status,
        info_text: newInfo.info_text || null
      })
    })
    if (r.ok) {
      showMsg('success', 'Info-trafic créé !')
      setNewInfo({ target_class: 'both', subject: '', teacher_id: '', replacement_teacher_id: '', info_status: 'supprime', info_text: '', date: '', time_start: '' })
      loadAnnouncements()
    } else {
      showMsg('error', (await r.json()).error)
    }
  }

  const publishAnnouncement = async (id: string, action: 'publish' | 'unpublish') => {
    const r = await fetch('/api/admin/announcements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    })
    if (r.ok) {
      showMsg('success', action === 'publish' ? 'Publié avec succès !' : 'Dépublié avec succès !')
      loadAnnouncements()
    } else {
      showMsg('error', (await r.json()).error)
    }
  }

  const deleteAnnouncement = async (id: string) => {
    const r = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' })
    if (r.ok) {
      showMsg('success', 'Annonce supprimée')
      loadAnnouncements()
    } else {
      showMsg('error', (await r.json()).error)
    }
  }

  const createTax = async () => {
    if (!taxSelectedIds.length) { showMsg('error', 'Sélectionnez au moins un utilisateur'); return }
    const r = await fetch('/api/admin/taxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_ids: taxSelectedIds, ...newTax, amount: +newTax.amount })
    })
    const d = await r.json()
    if (r.ok) {
      const partial = d.errors?.length ? ` (${d.errors.length} erreur(s))` : ''
      showMsg('success', `✅ ${d.applied} prélèvement(s) effectués${partial} !`)
      setNewTax({ reason: '', amount: '', auto_deduct: false })
      setTaxSelectedIds([])
      setTaxUserSearch('')
      loadTaxes()
    } else showMsg('error', d.error)
  }

  const deleteTax = async (id: string) => {
    const r = await fetch(`/api/admin/taxes?id=${id}`, { method: 'DELETE' })
    if (r.ok) { showMsg('success', 'Impôt supprimé'); loadTaxes() }
  }

  const createItem = async () => {
    const r = await fetch('/api/admin/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price: +newItem.price })
    })
    if (r.ok) { showMsg('success', 'Article créé !'); setNewItem({ name: '', description: '', price: '', category: 'drinks', is_available: true }); loadItems() }
    else showMsg('error', (await r.json()).error)
  }

  const deleteItem = async (id: string) => {
    const r = await fetch(`/api/admin/shop?id=${id}`, { method: 'DELETE' })
    if (r.ok) { showMsg('success', 'Article supprimé'); loadItems() }
  }

  const toggleItem = async (id: string, current: boolean) => {
    await fetch('/api/admin/shop', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_available: !current })
    })
    loadItems()
  }

  const createRole = async () => {
    const r = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRole)
    })
    if (r.ok) {
      showMsg('success', 'Rôle créé !')
      setNewRole({ name: '', discord_role_id: '', color: '#5865F2' })
      loadRoles()
    } else showMsg('error', (await r.json()).error)
  }

  const updateRole = async (r: Role, field: string, value: any) => {
    const payload = { id: r.id, can_connect: r.can_connect, salary_amount: r.salary_amount, pocket_money: r.pocket_money, [field]: value }
    const res = await fetch('/api/admin/roles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      showMsg('success', 'Rôle mis à jour')
      loadRoles()
    } else showMsg('error', (await res.json()).error)
  }

  const filteredUsers = users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.discord_id.includes(search)
  )

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'finances', label: 'Finances', icon: ShieldAlert },
    { id: 'shop', label: 'Boutique', icon: ShoppingCart },
    { id: 'suggestions', label: 'Suggestions', icon: BookOpen },
    { id: 'cantine', label: 'Cantine', icon: RefreshCw },
    { id: 'roles', label: 'Rôles', icon: Settings },
    { id: 'money', label: 'Primes', icon: Wallet },
    { id: 'declarations', label: 'Déclarations', icon: FileText },
    { id: 'absences', label: 'Absences', icon: Calendar },
    { id: 'annonces', label: 'Annonces', icon: Megaphone },
    { id: 'maisons', label: 'Maisons', icon: Home },
  ]

  // Premium Slider Component
  const PremiumSlider = ({ label, value, icon, color, onChange }: { label: string, value: number, icon: string, color: string, onChange: (v: number) => void }) => {
    const pct = Math.round(value)
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-discord-muted">{icon} {label}</span>
          <span className="text-xs font-black text-white">{pct}%</span>
        </div>
        <div className="relative flex items-center h-5">
          <div className="absolute w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-75" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <input
            type="range" min={0} max={100} step={1} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="absolute w-full opacity-0 cursor-pointer h-5"
            style={{ WebkitAppearance: 'none' }}
          />
          <div
            className="absolute w-3 h-3 rounded-full bg-white shadow-md border-2 transition-all duration-75 pointer-events-none"
            style={{ left: `calc(${pct}% - 6px)`, borderColor: color }}
          />
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="page-container">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-12 h-12 bg-white/5 rounded-2xl" />
        <div className="h-6 w-48 bg-white/5 rounded" />
      </div>
    </div>
  )

  return (
    <div className="page-container">
      {/* Header */}
      <div className="animate-slideIn px-1">
        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 text-discord-error" />
          Administration
        </h1>
        <p className="text-discord-muted mt-1 font-medium text-sm md:text-base">
          Panneau de gestion LunaVerse — Mises à jour en temps réel.
        </p>
      </div>

      {/* Message */}
      {msg && (
        <div className={clsx(
          'p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-scaleIn border',
          msg.type === 'success'
            ? 'bg-discord-success/10 text-discord-success border-discord-success/20'
            : 'bg-discord-error/10 text-discord-error border-discord-error/20'
        )}>
          {msg.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-nowrap md:flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
                tab === t.id
                  ? 'bg-discord-blurple text-white shadow-lg shadow-discord-blurple/25'
                  : 'bg-white/5 text-discord-muted hover:bg-white/10 hover:text-white border border-white/8'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
        <button
          onClick={loadAll}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-white/5 text-discord-muted hover:text-white border border-white/8 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* ── Users Tab ──────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-muted" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur…"
              className="glass-input pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="glass-card overflow-hidden p-0 border-none md:border md:border-white/10">
            {/* Desktop Table View */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="border-b border-white/6 text-[10px] font-black text-discord-muted uppercase tracking-widest">
                  <th className="text-left p-4">Utilisateur</th>
                  <th className="text-left p-4 hidden md:table-cell">Discord ID</th>
                  <th className="text-right p-4">Solde</th>
                  <th className="text-center p-4 hidden lg:table-cell">Stats RP</th>
                  <th className="text-center p-4 hidden lg:table-cell">Tuto</th>
                  <th className="text-right p-4 hidden md:table-cell">Depuis</th>
                </tr>
              </thead>
              <tbody>
                 {filteredUsers.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-discord-muted">Aucun utilisateur trouvé</td></tr>
                )}
                {filteredUsers.map(u => (
                  <>
                  <tr key={u.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 relative rounded-full overflow-hidden ring-1 ring-discord-blurple/20 flex-shrink-0">
                          <Image
                            src={u.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                            alt={u.username} fill className="object-cover"
                          />
                        </div>
                        <span className="font-bold text-white">{u.username}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell font-mono text-discord-muted text-xs">{u.discord_id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                         <span className={clsx(
                           "text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5",
                           u.nickname_rp ? "text-discord-blurple border border-discord-blurple/30" : "text-discord-muted"
                         )}>
                            {u.nickname_rp || "Pas d'identité RP"}
                         </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-black text-discord-success">{u.balance?.toFixed(0)} €</td>
                    <td className="p-4 text-center hidden lg:table-cell">
                      <button
                        onClick={() => {
                          if (statsEditing === u.id) { setStatsEditing(null); return }
                          setStatsEditing(u.id)
                          setStatsValues({
                            health:  (u as any).health  ?? 100,
                            hunger:  (u as any).hunger  ?? 100,
                            thirst:  (u as any).thirst  ?? 100,
                            fatigue: (u as any).fatigue ?? 100,
                            hygiene: (u as any).hygiene ?? 100,
                            alcohol: (u as any).alcohol ?? 0,
                          })
                        }}
                        className={clsx(
                          'text-xs px-2 py-1 rounded-lg font-bold transition-all',
                          statsEditing === u.id
                            ? 'bg-discord-blurple text-white'
                            : 'bg-white/5 text-discord-muted hover:text-white'
                        )}
                      >
                        ❤️ Stats
                      </button>
                    </td>
                    <td className="p-4 text-center hidden lg:table-cell">
                      <button
                        onClick={() => toggleFirstConnection(u.id, !!u.first_connection)}
                        className={clsx(
                          'text-xs px-2 py-1 rounded-lg font-bold transition-all',
                          u.first_connection
                            ? 'bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30'
                            : 'bg-white/5 text-discord-muted hover:text-white'
                        )}
                        title={u.first_connection ? 'Cliquer pour désactiver le tutoriel' : 'Cliquer pour réactiver le tutoriel'}
                      >
                        {u.first_connection ? '📖 Actif' : '— Off'}
                      </button>
                    </td>
                    <td className="p-4 text-right text-discord-muted hidden md:table-cell text-xs">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                  {statsEditing === u.id && (
                    <tr key={`stats-${u.id}`}>
                      <td colSpan={6} className="px-4 pb-4">
                        <div className="bg-white/3 border border-white/10 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-6 gap-6 shadow-inner">
                          <PremiumSlider 
                             label="Santé" value={statsValues.health} icon="❤️" color="#ED4245"
                             onChange={v => setStatsValues(s => ({ ...s, health: v }))} 
                          />
                          <PremiumSlider 
                             label="Faim" value={statsValues.hunger} icon="🍔" color="#F97316"
                             onChange={v => setStatsValues(s => ({ ...s, hunger: v }))} 
                          />
                          <PremiumSlider 
                             label="Soif" value={statsValues.thirst} icon="💧" color="#60A5FA"
                             onChange={v => setStatsValues(s => ({ ...s, thirst: v }))} 
                          />
                          <PremiumSlider 
                             label="Fatigue" value={statsValues.fatigue} icon="😴" color="#818CF8"
                             onChange={v => setStatsValues(s => ({ ...s, fatigue: v }))} 
                          />
                          <PremiumSlider 
                             label="Hygiène" value={statsValues.hygiene} icon="🧴" color="#2DD4BF"
                             onChange={v => setStatsValues(s => ({ ...s, hygiene: v }))} 
                          />
                          <PremiumSlider 
                             label="Alcool" value={statsValues.alcohol} icon="🍺" color="#22C55E"
                             onChange={v => setStatsValues(s => ({ ...s, alcohol: v }))} 
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-4 p-3 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-[10px] font-black uppercase text-discord-muted tracking-widest whitespace-nowrap">👤 Identité RP</span>
                          <input
                            type="text"
                            className="glass-input !py-1.5 !text-sm flex-1"
                            placeholder="Prénom NOM"
                            defaultValue={u.nickname_rp || ''}
                            onChange={e => setNicknameValue(e.target.value)}
                            onFocus={() => { setNicknameEditing(u.id); setNicknameValue(u.nickname_rp || '') }}
                          />
                          {nicknameEditing === u.id && (
                            <button onClick={() => saveNicknameRp(u.id)} className="btn btn-success py-1.5 text-xs whitespace-nowrap">
                              <Save className="w-3.5 h-3.5" /> OK
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => saveStats(u.id)} className="btn btn-primary py-1.5 text-xs">
                            <Save className="w-3.5 h-3.5" /> Sauvegarder
                          </button>
                          <button onClick={() => setStatsEditing(null)} className="btn btn-ghost py-1.5 text-xs">
                            <X className="w-3.5 h-3.5" /> Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-discord-muted">Aucun utilisateur trouvé</div>
              )}
              {filteredUsers.map(u => (
                <div key={u.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 relative rounded-full overflow-hidden ring-1 ring-discord-blurple/20 flex-shrink-0">
                        <Image
                          src={u.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                          alt={u.username} fill className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-white text-base">{u.username}</p>
                        <p className="text-[10px] font-mono text-discord-muted">{u.discord_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-discord-success">{u.balance?.toFixed(0)} €</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5",
                      u.nickname_rp ? "text-discord-blurple border border-discord-blurple/30" : "text-discord-muted"
                    )}>
                      {u.nickname_rp || "Pas d'identité RP"}
                    </span>
                    <button
                      onClick={() => {
                        if (statsEditing === u.id) { setStatsEditing(null); return }
                        setStatsEditing(u.id)
                        setStatsValues({
                          health:  (u as any).health  ?? 100,
                          hunger:  (u as any).hunger  ?? 100,
                          thirst:  (u as any).thirst  ?? 100,
                          fatigue: (u as any).fatigue ?? 100,
                          hygiene: (u as any).hygiene ?? 100,
                          alcohol: (u as any).alcohol ?? 0,
                        })
                      }}
                      className={clsx(
                        'text-xs px-3 py-1.5 rounded-xl font-bold transition-all',
                        statsEditing === u.id
                          ? 'bg-discord-blurple text-white shadow-lg shadow-discord-blurple/20'
                          : 'bg-white/5 text-discord-muted border border-white/10'
                      )}
                    >
                      ❤️ Stats
                    </button>
                  </div>

                  {statsEditing === u.id && (
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-4 shadow-inner animate-fadeIn">
                       <div className="grid grid-cols-2 gap-4">
                        <PremiumSlider 
                            label="Santé" value={statsValues.health} icon="❤️" color="#ED4245"
                            onChange={v => setStatsValues(s => ({ ...s, health: v }))} 
                        />
                        <PremiumSlider 
                            label="Faim" value={statsValues.hunger} icon="🍔" color="#F97316"
                            onChange={v => setStatsValues(s => ({ ...s, hunger: v }))} 
                        />
                        <PremiumSlider 
                            label="Soif" value={statsValues.thirst} icon="💧" color="#60A5FA"
                            onChange={v => setStatsValues(s => ({ ...s, thirst: v }))} 
                        />
                        <PremiumSlider 
                            label="Fatigue" value={statsValues.fatigue} icon="😴" color="#818CF8"
                            onChange={v => setStatsValues(s => ({ ...s, fatigue: v }))} 
                        />
                        <PremiumSlider 
                            label="Hygiène" value={statsValues.hygiene} icon="🧴" color="#2DD4BF"
                            onChange={v => setStatsValues(s => ({ ...s, hygiene: v }))} 
                        />
                        <PremiumSlider 
                            label="Alcool" value={statsValues.alcohol} icon="🍺" color="#22C55E"
                            onChange={v => setStatsValues(s => ({ ...s, alcohol: v }))} 
                        />
                      </div>
                      <div className="flex items-center gap-2 p-2.5 bg-black/20 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black uppercase text-discord-muted tracking-widest whitespace-nowrap">👤 RP</span>
                        <input
                          type="text"
                          className="glass-input !py-1 !text-xs flex-1"
                          placeholder="Prénom NOM"
                          defaultValue={u.nickname_rp || ''}
                          onChange={e => setNicknameValue(e.target.value)}
                          onFocus={() => { setNicknameEditing(u.id); setNicknameValue(u.nickname_rp || '') }}
                        />
                        {nicknameEditing === u.id && (
                          <button onClick={() => saveNicknameRp(u.id)} className="btn btn-success py-1 text-[10px]">OK</button>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button onClick={() => saveStats(u.id)} className="flex-1 btn btn-primary py-2 text-xs">
                          <Save size={14} /> Sauver
                        </button>
                        <button onClick={() => setStatsEditing(null)} className="flex-1 btn btn-ghost py-2 text-xs">
                          <X size={14} /> Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-discord-muted text-right">{filteredUsers.length} utilisateur(s) au total</p>
        </div>
      )}

      {/* ── Money Tab ──────────────────────────────────────── */}
      {tab === 'money' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card max-w-lg shadow-[0_0_20px_rgba(87,242,135,0.1)] border-discord-success/20">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <span className="text-xl">🎁</span>
              Attribuer une Prime
            </h3>
            <div className="space-y-3">
              <div className="relative" data-give-picker>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Utilisateurs ciblés ({giveSelectedIds.length})</label>
                <button
                  className="glass-input w-full flex items-center justify-between text-left focus:border-discord-success"
                  onClick={() => setGivePickerOpen(!givePickerOpen)}
                >
                  <span className="truncate">
                    {giveSelectedIds.length === 0 
                      ? 'Sélectionner des utilisateurs...' 
                      : giveSelectedIds.length === 1 
                        ? users.find(u => u.id === giveSelectedIds[0])?.username 
                        : `${giveSelectedIds.length} utilisateurs sélectionnés`}
                  </span>
                  <ChevronDown className={clsx('w-4 h-4 transition-transform', givePickerOpen && 'rotate-180')} />
                </button>
                {givePickerOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-discord-dark/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto flex flex-col custom-scrollbar">
                    <div className="sticky top-0 bg-discord-dark/95 p-2 border-b border-white/6 z-10 flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        className="glass-input w-full !py-1.5 !text-sm"
                        value={giveUserSearch}
                        onChange={e => setGiveUserSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                      />
                      <button 
                        className="btn btn-ghost !py-1 !text-[10px] w-full"
                        onClick={() => {
                          setGiveSelectedIds(users.map(u => u.id))
                          setGiveUserSearch('')
                        }}
                      >
                        <Check className="w-3.5 h-3.5" /> Sélectionner tout le serveur ({users.length})
                      </button>
                    </div>
                    {users
                      .filter(u => !giveUserSearch || u.username.toLowerCase().includes(giveUserSearch.toLowerCase()) || u.discord_id.includes(giveUserSearch) || (u.nickname_rp && u.nickname_rp.toLowerCase().includes(giveUserSearch.toLowerCase())))
                      .map(u => {
                        const selected = giveSelectedIds.includes(u.id)
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setGiveSelectedIds(prev =>
                                selected ? prev.filter(x => x !== u.id) : [...prev, u.id]
                              )
                            }}
                            className={clsx(
                              'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                              selected ? 'bg-discord-success/10 text-discord-success' : 'text-white hover:bg-white/5'
                            )}
                          >
                            {selected
                              ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                              : <div className="w-3.5 h-3.5 rounded border border-white/20 flex-shrink-0" />}
                            <span className="font-bold truncate">{u.nickname_rp || u.username}</span>
                            <span className="text-xs text-discord-muted ml-auto font-mono">{u.discord_id}</span>
                          </button>
                        )
                      })}
                    <button
                      className="w-full text-xs text-discord-muted px-3 py-2 hover:bg-white/5 transition-colors border-t border-white/6"
                      onClick={() => setGivePickerOpen(false)}
                    >Fermer ✕</button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Montant (€)</label>
                <input type="number" placeholder="Ex: 500" className="glass-input focus:border-discord-success"
                  value={giveAmount} onChange={e => setGiveAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Motif / Raison</label>
                <input type="text" placeholder="Ex: Aide pour l'événement, Victoire au tournoi..." className="glass-input focus:border-discord-success"
                  value={giveReason} onChange={e => setGiveReason(e.target.value)} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input type="checkbox" checked={giveAutoAdd} onChange={e => setGiveAutoAdd(e.target.checked)} className="luna-checkbox" />
                <div>
                  <p className="text-sm font-bold text-white">Versement automatique</p>
                  <p className="text-[10px] text-discord-muted">Si activé, l&apos;argent est crédité immédiatement sur le solde. Sinon, le joueur devra réclamer la prime.</p>
                </div>
              </label>
              <button onClick={giveMoney} disabled={!giveSelectedIds.length || !giveAmount} className="btn btn-success w-full py-3 mt-2">
                <Send className="w-4 h-4" /> Envoyer la prime{giveSelectedIds.length > 1 ? ` (${giveSelectedIds.length} utilisateurs)` : ''}
              </button>
            </div>
          </div>

          {/* Trigger salary */}
          <div className="glass-card max-w-lg border-discord-success/20">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-discord-success" />
              Salaires hebdomadaires
            </h3>
            <p className="text-discord-muted text-sm mb-4">
              Distribue les salaires à tous les profils éligibles (dernier versement &gt; 6 jours).
              Se déclenche automatiquement chaque lundi à minuit via le bot.
            </p>
            <button
              onClick={async () => {
                const r = await fetch('/api/cron/salary', { method: 'POST' })
                const d = await r.json()
                if (r.ok) showMsg('success', `✅ ${d.paid} salaire(s) versé(s), ${d.skipped} skippé(s)`)
                else showMsg('error', d.error)
              }}
              className="btn btn-success w-full py-3"
            >
              <RefreshCw className="w-4 h-4" />
              Déclencher le versement maintenant
            </button>
          </div>
        </div>
      )}

      {/* ── Finances Tab ──────────────────────────────────────── */}
      {tab === 'finances' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Create Tax */}
          <div className="glass-card">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-discord-error" /> Saisir un impôt / Redressement
            </h3>
            <div className="space-y-3">

              {/* ── Multi-user selector ── */}
              <div className="relative" data-tax-picker>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block">Utilisateurs cibles</label>

                {/* Selected tags */}
                {taxSelectedIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {taxSelectedIds.map(id => {
                      const u = users.find(u => u.id === id)
                      return (
                        <span key={id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-discord-error/15 text-discord-error border border-discord-error/25 font-bold">
                          {u?.username ?? id}
                          <button
                            onClick={() => setTaxSelectedIds(prev => prev.filter(x => x !== id))}
                            className="ml-0.5 hover:text-white transition-colors"
                          ><X className="w-3 h-3" /></button>
                        </span>
                      )
                    })}
                    <button
                      onClick={() => setTaxSelectedIds([])}
                      className="text-xs px-2 py-1 rounded-lg bg-white/5 text-discord-muted hover:text-white transition-colors"
                    >Tout effacer</button>
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-discord-muted pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur…"
                    className="glass-input pl-9 text-sm"
                    value={taxUserSearch}
                    onChange={e => { setTaxUserSearch(e.target.value); setTaxPickerOpen(true) }}
                    onFocus={() => setTaxPickerOpen(true)}
                  />
                </div>

                {/* Dropdown list */}
                {taxPickerOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-[#1e1f22] border border-white/10 shadow-xl">
                    {/* Select All row */}
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-discord-blurple hover:bg-discord-blurple/10 transition-colors border-b border-white/6"
                      onClick={() => {
                        setTaxSelectedIds(users.map(u => u.id))
                        setTaxPickerOpen(false)
                        setTaxUserSearch('')
                      }}
                    >
                      <Check className="w-3.5 h-3.5" /> Sélectionner tout le serveur ({users.length})
                    </button>
                    {users
                      .filter(u => !taxUserSearch || u.username.toLowerCase().includes(taxUserSearch.toLowerCase()) || u.discord_id.includes(taxUserSearch))
                      .map(u => {
                        const selected = taxSelectedIds.includes(u.id)
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setTaxSelectedIds(prev =>
                                selected ? prev.filter(x => x !== u.id) : [...prev, u.id]
                              )
                            }}
                            className={clsx(
                              'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                              selected ? 'bg-discord-error/10 text-discord-error' : 'text-white hover:bg-white/5'
                            )}
                          >
                            {selected
                              ? <Check className="w-3.5 h-3.5 flex-shrink-0" />
                              : <div className="w-3.5 h-3.5 rounded border border-white/20 flex-shrink-0" />}
                            <span className="font-bold truncate">{u.username}</span>
                            <span className="text-xs text-discord-muted ml-auto font-mono">{u.balance?.toFixed(0)} €</span>
                          </button>
                        )
                      })}
                    {users.filter(u => !taxUserSearch || u.username.toLowerCase().includes(taxUserSearch.toLowerCase()) || u.discord_id.includes(taxUserSearch)).length === 0 && (
                      <p className="text-discord-muted text-xs p-3">Aucun résultat</p>
                    )}
                    <button
                      className="w-full text-xs text-discord-muted px-3 py-2 hover:bg-white/5 transition-colors border-t border-white/6"
                      onClick={() => setTaxPickerOpen(false)}
                    >Fermer ✕</button>
                  </div>
                )}
              </div>

              <input placeholder="Raison (ex: Redressement de juin)" className="glass-input"
                value={newTax.reason} onChange={e => setNewTax({ ...newTax, reason: e.target.value })} />
              <input type="number" placeholder="Montant à prélever (€)" className="glass-input"
                value={newTax.amount} onChange={e => setNewTax({ ...newTax, amount: e.target.value })} />

              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input type="checkbox" checked={newTax.auto_deduct} onChange={e => setNewTax({ ...newTax, auto_deduct: e.target.checked })} className="luna-checkbox" />
                <div>
                  <p className="text-sm font-bold text-white">Prélèvement automatique</p>
                  <p className="text-[10px] text-discord-muted">Si activé, l&apos;argent est débité immédiatement du solde. Sinon, le joueur devra payer manuellement.</p>
                </div>
              </label>

              <button
                onClick={createTax}
                disabled={!taxSelectedIds.length || !newTax.amount}
                className="btn btn-error w-full text-white bg-discord-error/20 hover:bg-discord-error hover:border-discord-error disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Appliquer et Prélever{taxSelectedIds.length > 1 ? ` (${taxSelectedIds.length} utilisateurs)` : ''}
              </button>
            </div>
            <div className="mt-4 p-4 bg-discord-blurple/10 border border-discord-blurple/20 rounded-xl text-sm text-discord-blurple flex gap-2">
              <span className="text-lg">💡</span>
              Pour programmer les impôts globaux du serveur, modifiez le cron de Discord ou l&apos;intervalle dans `discord-bot.ts` directement ou utilisez le bouton ci-dessous, ce prélèvement est immédiat.
            </div>
          </div>

          {/* Taxes list */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest px-1">Historique des Prélèvements ({taxes.filter(t => Number(t.amount) > 0).length})</h3>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {taxes.filter(t => Number(t.amount) > 0).map(t => (
                <div key={t.id} className="glass-card flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-bold text-white text-sm">
                      Utilisateur : <span className="text-discord-blurple font-bold">@{t.target?.username || t.user_id || 'Inconnu'}</span>
                    </p>
                    <p className="text-xs text-discord-muted">{t.reason}</p>
                    <div className="mt-1 flex items-center gap-2">
                       <span className="text-discord-error font-black">-{t.amount}€</span>
                       {t.is_preleve ? <span className="bg-discord-success/20 text-discord-success px-2 py-0.5 rounded text-[10px] font-bold">Prélevé</span> : <span className="bg-discord-warning/20 text-discord-warning px-2 py-0.5 rounded text-[10px] font-bold">En attente</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteTax(t.id)} className="btn btn-error px-2 py-1.5 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {taxes.filter(t => Number(t.amount) > 0).length === 0 && <p className="text-discord-muted text-sm px-1">Aucun prélèvement enregistré.</p>}
            </div>
          </div>
          
          {/* Primes list (Negative taxes) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest px-1">Historique des Primes ({taxes.filter(t => Number(t.amount) < 0).length})</h3>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {taxes.filter(t => Number(t.amount) < 0).map(t => (
                <div key={t.id} className="glass-card flex items-center justify-between gap-4 py-3 border-l-2 border-l-discord-success">
                  <div>
                    <p className="font-bold text-white text-sm">
                      Bénéficiaire : <span className="text-discord-success font-bold">@{t.target?.username || t.user_id || 'Inconnu'}</span>
                    </p>
                    <p className="text-xs text-discord-muted">{t.reason}</p>
                    <div className="mt-1 flex items-center gap-2">
                       <span className="text-discord-success font-black">+{Math.abs(t.amount)}€</span>
                       {t.is_paid ? <span className="bg-discord-success/20 text-discord-success px-2 py-0.5 rounded text-[10px] font-bold">Versé</span> : <span className="bg-discord-warning/20 text-discord-warning px-2 py-0.5 rounded text-[10px] font-bold">À réclamer</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteTax(t.id)} className="btn btn-error px-2 py-1.5 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {taxes.filter(t => Number(t.amount) < 0).length === 0 && <p className="text-discord-muted text-sm px-1">Aucune prime enregistrée.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Shop Tab ──────────────────────────────────────── */}
      {tab === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Create item */}
          <div className="glass-card">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-discord-success" /> Nouvel article
            </h3>
            <div className="space-y-3">
              <input placeholder="Nom" className="glass-input" value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
              <textarea placeholder="Description" className="glass-input" rows={2}
                value={newItem.description}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Prix (€)" className="glass-input"
                  value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
                <select className="glass-input"
                  value={newItem.category}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                  <option value="food">Nourriture</option>
                  <option value="drink">Boissons</option>
                  <option value="snack">Snacks</option>
                  <option value="clothing">Vêtements</option>
                  <option value="special">Spéciaux</option>
                  <option value="luxury">Luxe</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <button onClick={createItem} className="btn btn-success w-full">
                <Plus className="w-4 h-4" /> Ajouter à la boutique
              </button>
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest px-1">Articles ({items.length})</h3>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {items.map(item => (
                <div key={item.id} className="glass-card flex items-center justify-between gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                    <p className="text-xs text-discord-success">{item.price} €</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleItem(item.id, item.is_available)}
                      className={clsx(
                        'text-xs px-2 py-1 rounded-lg font-bold transition-all',
                        item.is_available
                          ? 'bg-discord-success/15 text-discord-success hover:bg-discord-error/15 hover:text-discord-error'
                          : 'bg-discord-error/15 text-discord-error hover:bg-discord-success/15 hover:text-discord-success'
                      )}
                    >
                      {item.is_available ? 'Dispo' : 'Indispo'}
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="btn btn-error px-2 py-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-discord-muted text-sm px-1">Aucun article en boutique.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Roles Tab ──────────────────────────────────────── */}
      {tab === 'roles' && (
        <div className="animate-fadeIn space-y-6">
          
          {/* Nouveau Rôle (Super Admin) */}
          {isSuperAdmin && (
            <div className="glass-card max-w-2xl border-discord-blurple/20">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-discord-blurple" /> Nouveau Rôle
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-1 block">Nom</label>
                  <input placeholder="ex: Professeur" className="glass-input" value={newRole.name}
                    onChange={e => setNewRole({ ...newRole, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-1 block">Discord Role ID</label>
                  <input placeholder="ex: 123456789" className="glass-input font-mono text-sm" value={newRole.discord_role_id}
                    onChange={e => setNewRole({ ...newRole, discord_role_id: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-1 block">Couleur HEX</label>
                  <div className="flex gap-2">
                    <input type="color" className="h-10 w-12 rounded cursor-pointer bg-transparent border-none p-0" value={newRole.color}
                      onChange={e => setNewRole({ ...newRole, color: e.target.value })} />
                    <input placeholder="#HEX" className="glass-input font-mono text-sm" value={newRole.color}
                      onChange={e => setNewRole({ ...newRole, color: e.target.value })} />
                  </div>
                </div>
              </div>
              <button 
                onClick={createRole} 
                disabled={!newRole.name || !newRole.discord_role_id} 
                className="btn btn-primary w-full mt-4"
              >
                <Plus className="w-4 h-4" /> Créer le rôle
              </button>
            </div>
          )}

          <div className="glass-card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6 text-[10px] font-black text-discord-muted uppercase tracking-widest">
                  <th className="text-left p-4">Rôle</th>
                  <th className="text-left p-4">Discord ID</th>
                  <th className="text-center p-4">Connexion autorisée</th>
                  <th className="text-center p-4">Salaire / sem.</th>
                  <th className="text-center p-4">Argent de poche</th>
                </tr>
              </thead>
              <tbody>
                {rolesList.map(r => (
                  <tr key={r.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <span
                        className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                        style={{ background: `${r.color}20`, color: r.color, border: `1px solid ${r.color}40` }}
                      >
                        {r.name}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-discord-muted text-xs">{r.discord_role_id}</td>
                    
                    {/* Colonnes Editables pour SuperAdmin */}
                    <td className="p-4 text-center">
                      {isSuperAdmin ? (
                        <button
                          onClick={() => updateRole(r, 'can_connect', !r.can_connect)}
                          className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                            r.can_connect ? 'bg-discord-success/20 text-discord-success border border-discord-success/30' : 'bg-discord-error/20 text-discord-error border border-discord-error/30'
                          )}
                        >
                          {r.can_connect ? 'Oui ✅' : 'Non ❌'}
                        </button>
                      ) : (
                        <span className={r.can_connect ? 'text-discord-success font-bold' : 'text-discord-error font-bold'}>
                          {r.can_connect ? 'Oui' : 'Non'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-discord-success font-bold">
                      {isSuperAdmin ? (
                        <input
                          type="number"
                          className="glass-input !py-1 !px-2 w-20 text-center mx-auto"
                          defaultValue={r.salary_amount}
                          onBlur={e => updateRole(r, 'salary_amount', e.target.value)}
                        />
                      ) : `${r.salary_amount} €`}
                    </td>
                    <td className="p-4 text-center text-discord-warning font-bold">
                      {isSuperAdmin ? (
                        <input
                          type="number"
                          className="glass-input !py-1 !px-2 w-20 text-center mx-auto"
                          defaultValue={r.pocket_money}
                          onBlur={e => updateRole(r, 'pocket_money', e.target.value)}
                        />
                      ) : `${r.pocket_money} €`}
                    </td>
                  </tr>
                ))}
                {rolesList.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-discord-muted">Aucun rôle configuré.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ── Suggestions Tab ─────────────────────────────────── */}
      {tab === 'suggestions' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suggestions.map(s => (
              <div key={s.id} className="glass-card flex flex-col gap-3 relative overflow-hidden group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-discord-dark">
                    <Image src={s.author?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} width={32} height={32} alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{s.name}</h4>
                    <p className="text-[10px] text-discord-muted uppercase tracking-widest">Suggéré par {s.author?.username || 'Inconnu'}</p>
                  </div>
                  {s.status === 'approved' && <Check className="absolute top-2 right-2 text-discord-success w-4 h-4" />}
                </div>
                {s.description && <p className="text-xs text-discord-muted leading-relaxed line-clamp-2">{s.description}</p>}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <span className="text-xs font-black text-discord-success">{s.estimated_price ? `${s.estimated_price}€` : 'Prix libre'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => approveSuggestion(s.id)} className="p-1.5 rounded-lg bg-discord-success/15 text-discord-success hover:bg-discord-success hover:text-white transition-colors" title="Approuver">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteSuggestion(s.id)} className="p-1.5 rounded-lg bg-discord-error/15 text-discord-error hover:bg-discord-error hover:text-white transition-colors" title="Refuser">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {suggestions.length === 0 && <p className="text-discord-muted text-sm col-span-full py-12 text-center underline decoration-white/5 underline-offset-8">Aucune suggestion en attente.</p>}
          </div>
        </div>
      )}

      {/* ── Cantine Tab ─────────────────────────────────────── */}
      {tab === 'cantine' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Form */}
          <div className="lg:col-span-1 glass-card border border-white/5 bg-white/2 space-y-4">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-discord-blurple" /> Nouveau Menu
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1.5 block px-1 flex justify-between">
                  <span>Date du menu</span>
                  <span className="text-orange-500 font-bold">Week-end uniquement</span>
                </label>
                <input 
                  type="date" 
                  className="glass-input !bg-black/20" 
                  value={newCanteen.menu_date} 
                  onChange={e => {
                    const date = new Date(e.target.value)
                    const day = date.getDay()
                    if (day !== 0 && day !== 6) {
                      showMsg('error', '⚠️ La cantine n\'est ouverte que le samedi et dimanche !')
                      return
                    }
                    setNewCanteen(s => ({ ...s, menu_date: e.target.value }))
                  }} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1.5 block px-1">Début (HH:MM)</label>
                  <input type="time" readOnly className="glass-input !bg-black/40 font-mono opacity-50" value="15:30" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1.5 block px-1">Fin (HH:MM)</label>
                  <input type="time" readOnly className="glass-input !bg-black/40 font-mono opacity-50" value="16:00" />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <textarea placeholder="Entrée(s)" className="glass-input !bg-black/20 resize-none" rows={2} value={newCanteen.starter} onChange={e => setNewCanteen(s => ({ ...s, starter: e.target.value }))} />
                <textarea placeholder="Plat(s) Principal(aux) *" className="glass-input !bg-black/20 resize-none" rows={2} value={newCanteen.main} onChange={e => setNewCanteen(s => ({ ...s, main: e.target.value }))} />
                <textarea placeholder="Accompagnement(s)" className="glass-input !bg-black/20 resize-none" rows={2} value={newCanteen.side} onChange={e => setNewCanteen(s => ({ ...s, side: e.target.value }))} />
                <textarea placeholder="Dessert(s)" className="glass-input !bg-black/20 resize-none" rows={2} value={newCanteen.dessert} onChange={e => setNewCanteen(s => ({ ...s, dessert: e.target.value }))} />
                <textarea placeholder="Boisson(s)" className="glass-input !bg-black/20 resize-none" rows={2} value={newCanteen.drink} onChange={e => setNewCanteen(s => ({ ...s, drink: e.target.value }))} />
                <textarea placeholder="Note facultative" className="glass-input !bg-black/20 resize-none" rows={2} value={newCanteen.note} onChange={e => setNewCanteen(s => ({ ...s, note: e.target.value }))} />
              </div>
              <button onClick={createCanteenMenu} disabled={!newCanteen.main} className="btn btn-primary w-full py-4 font-black shadow-[0_0_20px_rgba(88,101,242,0.3)] hover:shadow-discord-blurple/50 transition-all">
                Ajouter au calendrier
              </button>
            </div>
          </div>

          {/* Calendrier */}
          <div className="lg:col-span-2 space-y-4">
             <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest">Calendrier des menus</h3>
                <span className="text-[10px] font-bold text-discord-muted italic">Samedi & Dimanche : 15:30 - 16:00 recommandé</span>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {canteenMenus.map(m => (
                  <div key={m.id} className="glass-card border-l-4 border-l-orange-500/80 bg-white/2 hover:bg-white/4 transition-colors py-4 flex items-center justify-between gap-6 relative group">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full border border-orange-500/20 uppercase tracking-widest">
                            {new Date(m.menu_date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-xs font-black text-white px-2 py-1 bg-black/40 rounded-lg flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-discord-muted" /> {m.time_start.slice(0, 5)} - {m.time_end.slice(0, 5)}
                          </span>
                       </div>
                       <p className="text-sm font-bold mt-2 leading-relaxed whitespace-pre-wrap">
                          {m.starter && <span className="text-white/60">{m.starter}</span>}
                          {m.starter && <span className="text-discord-muted mx-2">/</span>}
                          <span className="text-orange-400 font-extrabold">{m.main}</span>
                          {m.side && <span className="text-discord-muted mx-2">/</span>}
                          {m.side && <span className="text-orange-300 font-bold">{m.side}</span>}
                          {m.dessert && <span className="text-discord-muted mx-2">/</span>}
                          {m.dessert && <span className="text-white/60">{m.dessert}</span>}
                          {m.drink && <span className="text-discord-muted mx-2">/</span>}
                          {m.drink && <span className="text-blue-300">{m.drink}</span>}
                       </p>
                       {m.note && <p className="text-[10px] text-discord-muted italic mt-1 font-medium opacity-60 group-hover:opacity-100 transition-opacity">💡 {m.note}</p>}
                    </div>
                    <button onClick={() => deleteCanteenMenu(m.id)} className="p-3 rounded-xl bg-discord-error/10 text-discord-error hover:bg-discord-error hover:text-white transition-all shadow-lg" title="Supprimer le menu">
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {canteenMenus.length === 0 && (
                  <div className="glass-card py-20 bg-white/2 flex flex-col items-center justify-center text-discord-muted border-dashed">
                    <RefreshCw className="w-10 h-10 opacity-20 mb-4 animate-spin-slow" />
                    <p className="font-bold">Aucun menu programmé</p>
                    <p className="text-xs opacity-60">Ajoutez votre premier menu via le formulaire.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
      {/* ── Declarations Tab ────────────────────────────────── */}
      {tab === 'declarations' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-black text-white">Gestion des blanchiments</h3>
            <p className="text-xs text-discord-muted font-bold uppercase tracking-widest">{declarations.filter(d => d.status === 'pending').length} demandes en attente</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {declarations.filter(d => d.status === 'pending').map(dec => (
              <div key={dec.id} className="glass-card flex flex-col md:flex-row items-start md:items-center gap-6 p-6 group">
                <div className="flex items-center gap-4 flex-1">
                   <div className="w-12 h-12 rounded-2xl relative overflow-hidden ring-2 ring-white/5">
                      <Image src={dec.profiles?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill className="object-cover" alt="" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-white text-lg">{dec.profiles?.username}</span>
                        <span className="text-[10px] font-mono text-discord-muted bg-black/40 px-1.5 py-0.5 rounded uppercase tracking-tighter">{dec.profiles?.discord_id}</span>
                      </div>
                      <p className="text-sm text-discord-muted line-clamp-1 italic">&quot;{dec.reason}&quot;</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-black uppercase text-discord-blurple bg-discord-blurple/10 px-2 py-0.5 rounded-full border border-discord-blurple/20">{dec.source}</span>
                        <span className="text-[10px] font-bold text-discord-muted uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {new Date(dec.created_at).toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                   <p className="text-3xl font-black text-white">{dec.amount.toFixed(0)}€</p>
                   {decProcessing === dec.id ? (
                      <div className="flex items-center gap-2 text-discord-muted animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Traitement...
                      </div>
                   ) : (
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                         <div className="flex items-center gap-4 mb-1">
                            <label className="flex items-center gap-2 cursor-pointer group/label">
                               <input 
                                 type="checkbox" 
                                 className="luna-checkbox"
                                 checked={!!penaltyMap[dec.id]}
                                 onChange={e => setPenaltyMap(prev => ({ ...prev, [dec.id]: e.target.checked }))}
                               />
                               <span className="text-[10px] font-black uppercase text-discord-muted group-hover/label:text-discord-error transition-colors">Pénalité Fiscale (-20%)</span>
                            </label>
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => processDeclaration(dec.id, 'accept')}
                             className="flex-1 md:flex-initial btn btn-success py-2 text-xs"
                           >
                             Accepter
                           </button>
                           <button 
                             onClick={() => processDeclaration(dec.id, 'refuse')}
                             className="flex-1 md:flex-initial btn btn-error py-2 text-xs"
                           >
                             Refuser
                           </button>
                         </div>
                      </div>
                   )}
                </div>
              </div>
            ))}
            {declarations.filter(d => d.status === 'pending').length === 0 && (
              <div className="glass-card py-20 text-center flex flex-col items-center justify-center opacity-50 border-dashed">
                <Check className="w-16 h-16 text-discord-success mb-4" />
                <p className="text-xl font-bold text-white">Tout est en ordre</p>
                <p className="text-sm text-discord-muted">Aucune déclaration en attente de validation.</p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest px-1">Traitées récemment</h3>
            <div className="glass-card p-0 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-white/6 text-[10px] font-black text-discord-muted uppercase tracking-widest bg-black/20">
                  <tr>
                    <th className="p-4">Utilisateur</th>
                    <th className="p-4">Raison</th>
                    <th className="p-4 text-right">Montant</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {declarations.filter(d => d.status !== 'pending').slice(0, 10).map(dec => (
                    <tr key={dec.id} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden relative"><Image src={dec.profiles?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill alt="" /></div>
                        <span className="font-bold text-white whitespace-nowrap">{dec.profiles?.username}</span>
                      </td>
                      <td className="p-4 text-discord-muted italic truncate max-w-[200px]">{dec.reason}</td>
                      <td className="p-4 text-right font-black text-white">{dec.amount.toFixed(0)}€</td>
                      <td className="p-4 text-center">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          dec.status === 'accepted' ? "bg-discord-success/10 text-discord-success border-discord-success/20" : "bg-discord-error/10 text-discord-error border-discord-error/20"
                        )}>
                          {dec.status === 'accepted' ? 'Accepté' : 'Refusé'}
                        </span>
                        {dec.has_penalty && <span className="ml-2 text-[10px] text-discord-error font-mono">(-FINE)</span>}
                      </td>
                      <td className="p-4 text-right text-discord-muted text-xs">
                        {new Date(dec.processed_at || dec.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Absences Tab ────────────────────────────────── */}
      {tab === 'absences' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-black text-white">Gestion des absences</h3>
            <p className="text-xs text-discord-muted font-bold uppercase tracking-widest">{absences.filter(a => a.status === 'pending').length} demandes en attente</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {absences.filter(a => a.status === 'pending').map(abs => (
              <div key={abs.id} className="glass-card flex flex-col md:flex-row items-start md:items-center gap-6 p-6 group">
                <div className="flex items-center gap-4 flex-1">
                   <div className="w-12 h-12 rounded-2xl relative overflow-hidden ring-2 ring-white/5">
                      <Image src={abs.profile?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill className="object-cover" alt="" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-white text-lg">{abs.profile?.nickname_rp || abs.profile?.username || 'Utilisateur inconnu'}</span>
                        <span className="text-[10px] font-mono text-discord-muted bg-black/40 px-1.5 py-0.5 rounded uppercase tracking-tighter">{abs.user_id?.split('-')[0]}</span>
                      </div>
                      <p className="text-sm text-discord-muted line-clamp-1 italic">&quot;{abs.reason}&quot;</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-black uppercase text-discord-warning bg-discord-warning/10 px-2 py-0.5 rounded-full border border-discord-warning/20">{abs.duration}</span>
                        <span className="text-[10px] font-bold text-discord-muted uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {new Date(abs.created_at).toLocaleDateString()}</span>
                      </div>
                      {abs.attachments && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-discord-muted" />
                          <p className="text-[10px] text-discord-muted truncate">PJ : {abs.attachments}</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                   <button 
                     onClick={() => processAbsence(abs.id, 'accepted')}
                     className="flex-1 md:flex-initial btn btn-success py-2 text-xs"
                   >
                     Valider
                   </button>
                   <button 
                     onClick={() => processAbsence(abs.id, 'refused')}
                     className="flex-1 md:flex-initial btn btn-error py-2 text-xs"
                   >
                     Refuser
                   </button>
                </div>
              </div>
            ))}
            {absences.filter(a => a.status === 'pending').length === 0 && (
              <div className="glass-card py-20 text-center flex flex-col items-center justify-center opacity-50 border-dashed">
                <Calendar className="w-16 h-16 text-discord-blurple mb-4" />
                <p className="text-xl font-bold text-white">Aucune absence</p>
                <p className="text-sm text-discord-muted">Toutes les demandes ont été traitées.</p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest px-1">Traitées récemment</h3>
            <div className="glass-card p-0 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-white/6 text-[10px] font-black text-discord-muted uppercase tracking-widest bg-black/20">
                  <tr>
                    <th className="p-4">Utilisateur</th>
                    <th className="p-4">Raison</th>
                    <th className="p-4">Durée</th>
                    <th className="p-4 text-center">Statut</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {absences.filter(a => a.status !== 'pending').slice(0, 10).map(abs => (
                    <tr key={abs.id} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden relative"><Image src={abs.profile?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill alt="" /></div>
                        <span className="font-bold text-white whitespace-nowrap">{abs.profile?.nickname_rp || abs.profile?.username || 'Inconnu'}</span>
                      </td>
                      <td className="p-4 text-discord-muted italic truncate max-w-[200px]">{abs.reason}</td>
                      <td className="p-4 text-white font-bold">{abs.duration}</td>
                      <td className="p-4 text-center">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          abs.status === 'accepted' ? "bg-discord-success/10 text-discord-success border-discord-success/20" : "bg-discord-error/10 text-discord-error border-discord-error/20"
                        )}>
                          {abs.status === 'accepted' ? 'Validé' : 'Refusé'}
                        </span>
                      </td>
                      <td className="p-4 text-right text-discord-muted text-xs">
                        {new Date(abs.processed_at || abs.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Maisons Tab ────────────────────────────────────── */}
      {tab === 'maisons' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 gap-4">
            {houses.filter(h => h.status === 'pending').map(house => (
              <div key={house.id} className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-discord-blurple shadow-xl">
                 <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden relative shadow-lg flex-shrink-0">
                      <Image src={house.profiles?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill className="object-cover" alt="" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xl font-black text-white truncate">{house.name}</h4>
                      <p className="text-sm text-discord-muted flex items-center gap-2 mb-2">
                        Demandé par <span className="text-discord-blurple font-bold">@{house.profiles?.username}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase text-discord-blurple">{house.house_type || 'Maison'}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white">{house.square_meters || '—'} m²</span>
                        <span className="px-2 py-0.5 rounded bg-discord-success/15 border border-discord-success/20 text-[10px] font-black text-discord-success">{house.purchase_price ? `${house.purchase_price.toLocaleString()}€` : 'Gratuit'}</span>
                      </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                    <button 
                      onClick={() => processHouse(house.id, 'active')}
                      className="flex-1 md:flex-initial btn btn-success py-2 px-6 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Accepter
                    </button>
                    <button 
                      onClick={() => processHouse(house.id, 'rejected')}
                      className="flex-1 md:flex-initial btn btn-error py-2 px-6 text-xs flex items-center gap-2"
                    >
                      <X size={14} /> Refuser
                    </button>
                 </div>
              </div>
            ))}

            {houses.filter(h => h.status === 'pending').length === 0 && (
              <div className="glass-card py-20 text-center opacity-50 border-dashed">
                <Home className="w-16 h-16 text-discord-blurple mx-auto mb-4" />
                <p className="text-xl font-bold text-white">Aucune demande de maison</p>
                <p className="text-sm text-discord-muted">Le marché immobilier est calme !</p>
              </div>
            )}
          </div>

          {/* Recently processed houses */}
          <div className="mt-8 space-y-3">
             <h3 className="text-xs font-black text-discord-muted uppercase tracking-widest px-1">Historique des Maisons</h3>
             <div className="glass-card p-0 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-white/6 text-[10px] font-black text-discord-muted uppercase tracking-widest bg-black/20">
                    <tr>
                      <th className="p-4">Maison</th>
                      <th className="p-4">Propriétaire</th>
                      <th className="p-4 text-center">Type / Taille</th>
                      <th className="p-4 text-right">Prix</th>
                      <th className="p-4 text-center">Statut</th>
                      <th className="p-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {houses.filter(h => h.status !== 'pending').slice(0, 10).map(h => (
                      <tr key={h.id} className="hover:bg-white/2 transition-colors">
                        <td className="p-4 font-bold text-white">{h.name}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden relative flex-shrink-0"><Image src={h.profiles?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill className="object-cover" alt="" /></div>
                            <span className="text-discord-muted">@{h.profiles?.username}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-xs font-bold text-white uppercase">{h.house_type || '—'}</span>
                          <span className="text-xs text-discord-muted ml-2">({h.square_meters || '—'} m²)</span>
                        </td>
                        <td className="p-4 text-right font-bold text-discord-success">
                          {h.purchase_price ? `${Number(h.purchase_price).toLocaleString()}€` : '0€'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={clsx(
                             "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                             h.status === 'active' ? "bg-discord-success/10 text-discord-success border-discord-success/20" : "bg-discord-error/10 text-discord-error border-discord-error/20"
                          )}>
                             {h.status === 'active' ? 'Active' : 'Refusée'}
                          </span>
                        </td>
                        <td className="p-4 text-right text-discord-muted text-xs">
                          {new Date(h.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Active houses & DLCs */}
          <div className="mt-8 space-y-4">
             <h3 className="text-xl font-black text-white px-1">Maisons Actives & DLCs</h3>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               {houses.filter(h => h.status === 'active').map(house => (
                 <div key={house.id} className="glass-card p-6 flex flex-col gap-4 border-l-4 border-l-discord-success shadow-xl">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden relative shadow-lg">
                          <Image src={house.profiles?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill alt="" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-white">{house.name}</h4>
                          <p className="text-sm text-discord-muted flex items-center gap-2">
                            Propriétaire : <span className="text-discord-blurple font-bold">@{house.profiles?.username}</span>
                          </p>
                        </div>
                     </div>
                     <button 
                       onClick={() => processHouse(house.id, 'rejected')}
                       className="w-8 h-8 rounded-full bg-discord-error/10 text-discord-error flex items-center justify-center hover:bg-discord-error hover:text-white transition-colors"
                       title="Détruire la maison"
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                   
                   <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                      <h5 className="text-xs font-bold text-discord-muted uppercase tracking-widest">Meubles & Aménagements (DLCs)</h5>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'bed', label: 'Lit (Énergie)', icon: '🛏️' },
                          { id: 'fridge', label: 'Frigo (Faim/Soif)', icon: '❄️' },
                          { id: 'pool', label: 'Piscine', icon: '🏊' },
                          { id: 'garage', label: 'Garage', icon: '🚗' },
                          { id: 'cinema', label: 'Home Cinéma', icon: '🍿' },
                          { id: 'security', label: 'Système d\'Alarme', icon: '🚨' }
                        ].map(dlc => {
                           const hasDlc = house.furnishings && house.furnishings[dlc.id]
                           return (
                             <button
                               key={dlc.id}
                               onClick={() => updateHouseFurnishing(house.id, dlc.id, !hasDlc)}
                               className={clsx(
                                 "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border",
                                 hasDlc ? "bg-discord-blurple/20 text-discord-blurple border-discord-blurple/30" : "bg-black/20 text-discord-muted border-white/5 hover:bg-white/5 hover:text-white"
                               )}
                             >
                               {dlc.icon} {dlc.label}
                             </button>
                           )
                        })}
                      </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
      {/* ── Annonces & Info-Trafic Tab ──────────────────────────────── */}
      {tab === 'annonces' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Section A: Annonces de Cours */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-8 h-8 text-discord-blurple" />
                <div>
                  <h2 className="text-xl font-black text-white">Annonces de Cours</h2>
                  <p className="text-xs text-discord-muted">Planifier l&apos;envoi d&apos;une annonce (Samedis et Dimanches)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-discord-muted uppercase">Classe Cible</label>
                  <select
                    className="glass-input w-full"
                    value={newCourse.target_class}
                    onChange={e => setNewCourse({ ...newCourse, target_class: e.target.value })}
                  >
                    <option value="nova">Classe Nova</option>
                    <option value="nebuleuse">Classe Nébuleuse</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-discord-muted uppercase">Matière</label>
                  <select
                    className="glass-input w-full"
                    value={newCourse.subject}
                    onChange={e => setNewCourse({ ...newCourse, subject: e.target.value })}
                  >
                    <option value="">Sélectionnez une matière...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-discord-muted uppercase">Professeur (Optionnel)</label>
                  <select
                    className="glass-input w-full"
                    value={newCourse.teacher_id}
                    onChange={e => setNewCourse({ ...newCourse, teacher_id: e.target.value })}
                  >
                    <option value="">Sélectionnez un professeur...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.nickname_rp || u.username}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-discord-muted uppercase">Date</label>
                    <input
                      type="date"
                      className="glass-input w-full"
                      value={newCourse.date}
                      onChange={e => {
                        const date = new Date(e.target.value)
                        if (date.getDay() !== 0 && date.getDay() !== 6) {
                            showMsg('error', 'Les cours ne peuvent être planifiés que les samedis et dimanches.')
                            setNewCourse({ ...newCourse, date: '' })
                        } else {
                            setNewCourse({ ...newCourse, date: e.target.value })
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-discord-muted uppercase">Début</label>
                    <input
                      type="time"
                      className="glass-input w-full"
                      value={newCourse.time_start}
                      onChange={e => setNewCourse({ ...newCourse, time_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-discord-muted uppercase">Fin</label>
                    <input
                      type="time"
                      className="glass-input w-full"
                      value={newCourse.time_end}
                      onChange={e => setNewCourse({ ...newCourse, time_end: e.target.value })}
                    />
                  </div>
                </div>

                <button onClick={createAnnouncement} className="btn bg-discord-blurple hover:bg-discord-blurple/80 text-white py-3 w-full mt-2 font-bold flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Planifier le Cours
                </button>
              </div>
            </div>

            {/* Section B: Info-Trafic */}
            <div className="glass-card p-6 space-y-4 border-l-4 border-discord-error shadow-xl shadow-discord-error/10">
              <div className="flex items-center gap-3 mb-6">
                <Info className="w-8 h-8 text-discord-error" />
                <div>
                  <h2 className="text-xl font-black text-white">Info-Trafic</h2>
                  <p className="text-xs text-discord-muted">Annonces immédiates sur Discord (Cours modifiés, absences)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-discord-muted uppercase">Statut</label>
                  <select
                    className="glass-input w-full border-discord-error/50 focus:border-discord-error bg-[#2B2D31]"
                    value={newInfo.info_status}
                    onChange={e => setNewInfo({ ...newInfo, info_status: e.target.value })}
                  >
                    <option value="supprime">Cours Supprimé</option>
                    <option value="remplace">Professeur Remplacé</option>
                    <option value="retard">Retard</option>
                    <option value="deplace">Cours Déplacé</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-discord-muted uppercase">Matière Concernée (Optionnel)</label>
                  <select
                    className="glass-input w-full bg-[#2B2D31]"
                    value={newInfo.subject}
                    onChange={e => setNewInfo({ ...newInfo, subject: e.target.value })}
                  >
                    <option value="">Sélectionnez une matière...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-discord-muted uppercase">Classe Concernée</label>
                    <select
                        className="glass-input w-full bg-[#2B2D31]"
                        value={newInfo.target_class}
                        onChange={e => setNewInfo({ ...newInfo, target_class: e.target.value })}
                    >
                        <option value="both">Général (Les deux classes)</option>
                        <option value="nova">Classe Nova</option>
                        <option value="nebuleuse">Classe Nébuleuse</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-discord-muted uppercase">Prof. Titulaire</label>
                    <select
                      className="glass-input w-full bg-[#2B2D31]"
                      value={newInfo.teacher_id}
                      onChange={e => setNewInfo({ ...newInfo, teacher_id: e.target.value })}
                    >
                      <option value="">Sélectionnez...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.nickname_rp || u.username}</option>)}
                    </select>
                  </div>
                </div>

                {newInfo.info_status === 'remplace' && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="text-xs font-bold text-discord-success uppercase">Professeur Remplaçant</label>
                    <select
                      className="glass-input w-full border-discord-success/50 bg-[#2B2D31]"
                      value={newInfo.replacement_teacher_id}
                      onChange={e => setNewInfo({ ...newInfo, replacement_teacher_id: e.target.value })}
                    >
                      <option value="">Sélectionnez le remplaçant...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.nickname_rp || u.username}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-discord-muted uppercase">Date (Optionnel)</label>
                    <input
                      type="date"
                      className="glass-input w-full"
                      value={newInfo.date}
                      onChange={e => setNewInfo({ ...newInfo, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-discord-muted uppercase">Heure (Optionnel)</label>
                    <input
                      type="time"
                      className="glass-input w-full"
                      value={newInfo.time_start}
                      onChange={e => setNewInfo({ ...newInfo, time_start: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-discord-muted uppercase">Informations Complémentaires</label>
                  <textarea
                    rows={2}
                    className="glass-input w-full resize-none"
                    placeholder="Ex: Le cours est reporté à la semaine prochaine..."
                    value={newInfo.info_text}
                    onChange={e => setNewInfo({ ...newInfo, info_text: e.target.value })}
                  />
                </div>

                <button onClick={createInfoTrafic} className="btn bg-discord-error hover:bg-discord-error/80 text-white py-3 w-full mt-2 font-bold flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" /> Publier l&apos;Alerte Info-Trafic
                </button>
              </div>
            </div>
          </div>

          {/* Lists of announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 animate-fadeIn">
            <div className="space-y-4">
               <h3 className="text-lg font-black text-white px-1">Cours Planifiés</h3>
               <div className="space-y-3">
                 {announcements.filter(a => a.type === 'course').map(a => (
                   <div key={a.id} className="glass-card p-4 flex flex-col gap-3">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="font-bold text-white">{a.subject}</p>
                         <p className="text-xs text-discord-muted">Classe : {a.target_class} • Prof : {a.teacher?.nickname_rp || 'Aucun'}</p>
                         <p className="text-xs text-discord-muted">
                           {a.start_time ? new Date(a.start_time).toLocaleString() : 'Date non définie'}
                         </p>
                       </div>
                       <span className={clsx("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border", a.status === 'sent' ? "bg-discord-success/10 text-discord-success border-discord-success/20" : "bg-discord-warning/10 text-discord-warning border-discord-warning/20")}>
                         {a.status === 'sent' ? 'Publié' : 'En attente'}
                       </span>
                     </div>
                     <div className="flex gap-2">
                       {a.status === 'pending' && (
                         <button onClick={() => publishAnnouncement(a.id, 'publish')} className="btn btn-success py-1.5 px-3 text-xs flex-1">Publier</button>
                       )}
                       {a.status === 'sent' && (
                         <button onClick={() => publishAnnouncement(a.id, 'unpublish')} className="btn btn-error py-1.5 px-3 text-xs flex-1">Retirer</button>
                       )}
                       <button onClick={() => deleteAnnouncement(a.id)} className="btn bg-white/5 hover:bg-white/10 py-1.5 px-3 text-xs text-discord-error shadow-none">Supprimer</button>
                     </div>
                   </div>
                 ))}
                 {announcements.filter(a => a.type === 'course').length === 0 && (
                   <p className="text-sm text-discord-muted p-4 text-center glass-card">Aucun cours planifié.</p>
                 )}
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-black text-white px-1">Alertes Info-Trafic en cours</h3>
               <div className="space-y-3">
                 {announcements.filter(a => a.type === 'info').map(a => (
                   <div key={a.id} className="glass-card p-4 flex flex-col gap-3 border-l-2 border-l-discord-error">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="font-bold text-white uppercase">{a.info_status}</p>
                         <p className="text-xs text-discord-muted">Matière : {a.subject || 'N/A'} • Classe : {a.target_class}</p>
                         {a.info_text && <p className="text-xs text-discord-muted italic mt-1">&quot;{a.info_text}&quot;</p>}
                       </div>
                       <span className={clsx("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border", a.status === 'sent' ? "bg-discord-success/10 text-discord-success border-discord-success/20" : "bg-discord-muted/10 text-discord-muted border-discord-muted/20")}>
                         {a.status === 'sent' ? 'Actif' : 'Désactivé'}
                       </span>
                     </div>
                     <div className="flex gap-2">
                       {a.status === 'pending' && (
                         <button onClick={() => publishAnnouncement(a.id, 'publish')} className="btn btn-success py-1.5 px-3 text-xs flex-1">Réactiver</button>
                       )}
                       {a.status === 'sent' && (
                         <button onClick={() => publishAnnouncement(a.id, 'unpublish')} className="btn btn-error py-1.5 px-3 text-xs flex-1">Désactiver</button>
                       )}
                       <button onClick={() => deleteAnnouncement(a.id)} className="btn bg-white/5 hover:bg-white/10 py-1.5 px-3 text-xs text-discord-error shadow-none">Supprimer</button>
                     </div>
                   </div>
                 ))}
                 {announcements.filter(a => a.type === 'info').length === 0 && (
                   <p className="text-sm text-discord-muted p-4 text-center glass-card">Aucune alerte en cours.</p>
                 )}
               </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Maisons Tab ──────────────────────────────────────── */}
      {tab === 'maisons' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card p-6 bg-gradient-to-r from-discord-blurple/10 to-transparent">
            <h2 className="text-xl font-black text-white mb-1 flex items-center gap-3">
              <Home className="w-6 h-6 text-discord-blurple" />
              Gestion des Maisons
            </h2>
            <p className="text-sm text-discord-muted">Approuvez ou refusez les demandes. L&apos;approbation crée automatiquement un salon Discord privé.</p>
          </div>

          {/* Pending Requests */}
          {houses.filter(h => h.status === 'pending').length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-discord-warning uppercase tracking-widest px-1 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Demandes en attente ({houses.filter(h => h.status === 'pending').length})
              </h3>
              {houses.filter(h => h.status === 'pending').map(h => (
                <div key={h.id} className="glass-card p-5 border-discord-warning/20 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-discord-warning/30 flex-shrink-0 relative">
                      <Image
                        src={h.profiles?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                        alt="" fill className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-black text-lg truncate">&quot;{h.name}&quot;</p>
                      <p className="text-xs text-discord-muted truncate mb-2">par {h.profiles?.nickname_rp || h.profiles?.username || 'Inconnu'}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-discord-blurple">{h.house_type || 'Maison'}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white">{h.square_meters || '—'} m²</span>
                        <span className="px-2 py-0.5 rounded bg-discord-success/15 border border-discord-success/20 text-[9px] font-black text-discord-success">{h.purchase_price ? `${h.purchase_price.toLocaleString()}€` : 'Gratuit'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:ml-auto flex-shrink-0">
                    <button
                      onClick={() => processHouse(h.id, 'active')}
                      className="btn bg-discord-success hover:bg-discord-success/80 text-white py-2 px-6 text-sm font-bold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approuver
                    </button>
                    <button
                      onClick={() => processHouse(h.id, 'rejected')}
                      className="btn bg-discord-error hover:bg-discord-error/80 text-white py-2 px-6 text-sm font-bold flex items-center gap-2"
                    >
                      <X className="w-4 h-4" /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Houses Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-discord-muted uppercase tracking-widest px-1">
              Toutes les propriétés ({houses.length})
            </h3>
            {houses.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Home className="w-12 h-12 text-discord-muted mx-auto mb-3 opacity-20" />
                <p className="text-discord-muted">Aucune demande de maison pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {houses.map(h => {
                  const statusConfig: Record<string, { label: string; color: string; border: string }> = {
                    pending: { label: 'En attente', color: 'bg-discord-warning/10 text-discord-warning border-discord-warning/20', border: 'border-discord-warning/20' },
                    active: { label: 'Active', color: 'bg-discord-success/10 text-discord-success border-discord-success/20', border: 'border-discord-success/20' },
                    rejected: { label: 'Refusée', color: 'bg-discord-error/10 text-discord-error border-discord-error/20', border: 'border-discord-error/20' },
                  }
                  const sc = statusConfig[h.status] || statusConfig.pending

                  return (
                    <div key={h.id} className={clsx("glass-card p-5", sc.border)}>
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Owner info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0 relative">
                            <Image
                              src={h.profiles?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                              alt="" fill className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-white font-black truncate">{h.name}</p>
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-discord-blurple">{h.house_type || 'Maison'}</span>
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white">{h.square_meters || '—'} m²</span>
                            </div>
                            <p className="text-xs text-discord-muted truncate">@{h.profiles?.nickname_rp || h.profiles?.username || '—'}</p>
                          </div>
                        </div>

                        {/* Price Paid */}
                        <div className="text-sm font-black text-discord-success mr-4">
                          {h.purchase_price ? `${Number(h.purchase_price).toLocaleString()}€` : '0€'}
                        </div>

                        {/* Status badge */}
                        <span className={clsx("text-[10px] px-3 py-1 rounded-full uppercase font-black border whitespace-nowrap", sc.color)}>
                          {sc.label}
                        </span>

                        {/* Channel ID */}
                        <div className="text-xs text-discord-muted font-mono hidden lg:block">
                          {h.discord_channel_id ? `#${h.discord_channel_id}` : '—'}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          {h.status === 'pending' && (
                            <>
                              <button onClick={() => processHouse(h.id, 'active')} className="btn btn-success py-1.5 px-3 text-xs">Approuver</button>
                              <button onClick={() => processHouse(h.id, 'rejected')} className="btn btn-error py-1.5 px-3 text-xs">Refuser</button>
                            </>
                          )}
                          {h.status === 'rejected' && (
                            <button onClick={() => processHouse(h.id, 'active')} className="btn btn-success py-1.5 px-3 text-xs">Réactiver</button>
                          )}
                        </div>
                      </div>

                      {/* DLC Management (only for active houses) */}
                      {h.status === 'active' && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-3">Aménagements (DLCs)</p>
                          <div className="flex flex-wrap gap-2">
                            {['frigo', 'bed', 'tv', 'safe'].map(dlc => {
                              const isOwned = h.furnishings?.[dlc] === true
                              const labels: Record<string, string> = { frigo: '❄️ Frigo', bed: '🛏️ Lit', tv: '📺 TV', safe: '🔒 Coffre' }
                              return (
                                <button
                                  key={dlc}
                                  onClick={() => updateHouseFurnishing(h.id, dlc, !isOwned)}
                                  className={clsx(
                                    "text-xs px-3 py-1.5 rounded-lg font-bold transition-all border",
                                    isOwned
                                      ? "bg-discord-success/10 text-discord-success border-discord-success/20"
                                      : "bg-white/5 text-discord-muted border-white/10 hover:text-white hover:border-white/20"
                                  )}
                                >
                                  {labels[dlc]} {isOwned ? '✓' : '✗'}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
