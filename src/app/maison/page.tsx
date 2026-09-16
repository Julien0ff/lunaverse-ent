'use client'

import { useState, useEffect } from 'react'
import { Home, Key, Map, Layers, Plus, Users, Search, ShoppingCart, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const HOUSE_TYPES = [
  { 
    type: 'Appartement', price: 5000, maxRooms: 10, icon: Layers, 
    colorClass: 'text-discord-blurple', bgClass: 'bg-discord-blurple', 
    bgHoverClass: 'hover:bg-discord-blurple/80', bgLightClass: 'bg-discord-blurple/10' 
  },
  { 
    type: 'Maison', price: 20000, maxRooms: 20, icon: Home, 
    colorClass: 'text-discord-green', bgClass: 'bg-discord-green', 
    bgHoverClass: 'hover:bg-discord-green/80', bgLightClass: 'bg-discord-green/10' 
  },
  { 
    type: 'Villa', price: 50000, maxRooms: 40, icon: Map, 
    colorClass: 'text-discord-yellow', bgClass: 'bg-discord-yellow', 
    bgHoverClass: 'hover:bg-discord-yellow/80', bgLightClass: 'bg-discord-yellow/10' 
  }
]

export default function MaisonPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [inviteUserId, setInviteUserId] = useState('')

  // Modals
  const [buyConfirm, setBuyConfirm] = useState<{type: string, price: number} | null>(null)
  const [sellConfirm, setSellConfirm] = useState(false)

  useEffect(() => {
    if (user) fetchHouseData()
  }, [user])

  const fetchHouseData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/maison')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const executeBuy = async () => {
    if (!buyConfirm) return
    const { type } = buyConfirm
    setBuyConfirm(null)
    
    setBuying(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/maison/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      const result = await res.json()
      
      if (!res.ok) {
        setError(result.error || 'Erreur lors de l\'achat')
      } else {
        setSuccess(`Félicitations ! Vous êtes l'heureux propriétaire d'un ${type}.`)
        await fetchHouseData()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBuying(false)
    }
  }

  const executeSell = async () => {
    if (!sellConfirm) return
    setSellConfirm(false)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/maison/sell', { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la revente')
      setSuccess('Maison revendue avec succès.')
      await fetchHouseData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const inviteMember = async () => {
    if (!inviteUserId) {
      setError('Veuillez entrer un ID utilisateur.')
      return
    }
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/maison/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: inviteUserId })
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error)
      } else {
        setSuccess('Invitation envoyée !')
        setInviteUserId('')
        fetchHouseData()
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const respondToInvite = async (houseId: string, accept: boolean) => {
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/maison/invite/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseId, accept })
      })
      if (!res.ok) throw new Error('Erreur lors de la réponse à l\'invitation')
      setSuccess(accept ? 'Invitation acceptée !' : 'Invitation refusée.')
      fetchHouseData()
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-12 h-12 text-discord-blurple animate-spin" />
      </div>
    )
  }

  if (data?.status === 'pending_invite') {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] space-y-6">
        <div className="w-20 h-20 bg-discord-yellow/20 rounded-full flex items-center justify-center">
          <Home className="w-10 h-10 text-discord-yellow animate-bounce" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-2">Invitation en attente</h2>
          <p className="text-discord-muted max-w-md">Un adulte vous a invité à rejoindre sa maison. Accepter l'invitation vous donnera accès aux salons Discord privés.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => respondToInvite(data.house_id, true)} className="flex items-center px-4 py-2 rounded-xl font-bold transition-colors bg-discord-green/20 text-discord-green hover:bg-discord-green/30">
            <CheckCircle2 className="w-5 h-5 mr-2" /> Accepter
          </button>
          <button onClick={() => respondToInvite(data.house_id, false)} className="flex items-center px-4 py-2 rounded-xl font-bold transition-colors bg-discord-red/20 text-discord-red hover:bg-discord-red/30">
            <XCircle className="w-5 h-5 mr-2" /> Refuser
          </button>
        </div>
      </div>
    )
  }

  if (data?.status === 'no_house') {
    return (
      <div className="page-container max-w-5xl mx-auto space-y-8 animate-fadeIn">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-black text-white">Agence Immobilière</h1>
          <p className="text-discord-muted max-w-2xl mx-auto text-lg">
            Devenez propriétaire ! Achetez votre propre logement sur l'ENT avec vos euros. L'achat génère instantanément vos salons privés sur Discord.
          </p>
          {error && <div className="text-discord-red font-bold p-4 bg-discord-red/10 rounded-xl max-w-md mx-auto">{error}</div>}
          {success && <div className="text-discord-success font-bold p-4 bg-discord-success/10 rounded-xl max-w-md mx-auto">{success}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOUSE_TYPES.map((h, i) => (
            <div key={i} className="glass-card p-6 flex flex-col relative overflow-hidden group">
              <div className={clsx("absolute top-0 right-0 w-32 h-32 rounded-bl-full transition-transform group-hover:scale-110", h.bgLightClass)} />
              <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                <h.icon className={clsx("w-8 h-8", h.colorClass)} />
                {h.type}
              </h3>
              <p className="text-discord-muted text-sm font-medium mb-6">
                Idéal pour commencer, limité à {h.maxRooms} pièces maximum.
              </p>
              
              <div className="mt-auto">
                <div className="text-3xl font-black text-white mb-4">
                  {h.price.toLocaleString()} <span className="text-sm text-discord-muted">€</span>
                </div>
                <button 
                  onClick={() => setBuyConfirm({ type: h.type, price: h.price })}
                  disabled={buying}
                  className={clsx(
                    "w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 text-white transition-colors disabled:opacity-50",
                    h.bgClass, h.bgHoverClass
                  )}
                >
                  {buying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                  Acheter
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Buy Confirm */}
        {buyConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#1e1f22] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
              <h3 className="text-xl font-black text-white mb-2">Confirmer l'achat</h3>
              <p className="text-discord-muted mb-6">
                Voulez-vous vraiment acheter : <strong className="text-white">{buyConfirm.type}</strong> pour <strong className="text-discord-green">{buyConfirm.price} €</strong> ?<br/><br/>
                L'argent sera débité de votre compte bancaire en jeu.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setBuyConfirm(null)} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors">
                  Annuler
                </button>
                <button onClick={executeBuy} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-discord-blurple hover:bg-discord-blurple/80 transition-colors">
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (data?.status === 'has_house') {
    const { house, rooms, members, items } = data
    return (
      <div className="page-container max-w-6xl mx-auto space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="glass-card p-8 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-discord-blurple/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <Home className="w-10 h-10 text-discord-blurple" />
              {house.type} de {profile?.username || 'Moi'}
            </h1>
            <p className="text-discord-muted text-lg font-medium">
              Surface : {house.sq_meters} m² • Salons Discord générés
            </p>
          </div>
          <div className="hidden md:flex gap-4">
            <button className="flex items-center px-4 py-2 rounded-xl font-bold transition-colors bg-discord-blurple/20 text-discord-blurple border border-discord-blurple/30 hover:bg-discord-blurple/30">
              <Plus className="w-4 h-4 mr-2" /> Nouvelle Pièce
            </button>
            <button className="flex items-center px-4 py-2 rounded-xl font-bold transition-colors bg-white/10 text-white hover:bg-white/20 border border-white/5">
              <ShoppingCart className="w-4 h-4 mr-2" /> Boutique Meubles
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area: Rooms & Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Layers className="w-5 h-5 text-discord-muted" />
                Pièces & Salons ({rooms.length})
              </h2>
              {rooms.length === 0 ? (
                <div className="text-center py-8 text-discord-muted">Aucune pièce n'a encore été construite.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rooms.map((r: any) => (
                    <div key={r.id} className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center gap-4 hover:border-discord-blurple/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-discord-blurple/10 flex items-center justify-center">
                        {r.type === 'voice' ? <Key className="w-5 h-5 text-discord-green" /> : <Home className="w-5 h-5 text-discord-blurple" />}
                      </div>
                      <div>
                        <div className="font-bold text-white capitalize">{r.name}</div>
                        <div className="text-xs text-discord-muted uppercase tracking-wider">{r.type === 'voice' ? 'Vocal' : 'Textuel'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Meubles */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-discord-muted" />
                Meubles & Objets de la Maison
              </h2>
              {items.length === 0 ? (
                <div className="text-center py-8 text-discord-muted">Aucun meuble acheté pour le moment.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {items.map((it: any) => (
                    <div key={it.id} className="p-3 bg-black/20 rounded-xl text-center border border-white/5">
                      <div className="text-2xl mb-2">📦</div>
                      <div className="font-bold text-sm text-white capitalize">{it.item_id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Family Members */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex flex-col mb-6 gap-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Users className="w-5 h-5 text-discord-muted" />
                  Membres
                </h2>
                {user.id === house.owner_id && (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ID Utilisateur (UUID)" 
                      value={inviteUserId}
                      onChange={e => setInviteUserId(e.target.value)}
                      className="glass-input text-xs flex-1"
                    />
                    <button onClick={inviteMember} className="bg-discord-blurple text-white px-3 py-1 rounded text-xs font-bold hover:bg-discord-blurple/80">
                      Inviter
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Owner */}
                <div className="flex items-center gap-3 p-3 bg-discord-blurple/10 rounded-xl border border-discord-blurple/20">
                  <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold">
                    {(profile?.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Vous</div>
                    <div className="text-xs text-discord-blurple font-medium uppercase">Propriétaire</div>
                  </div>
                </div>

                {/* Other Members */}
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                    {m.user?.avatar_url ? (
                      <img src={m.user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-discord-dark flex items-center justify-center text-discord-muted font-bold">
                        {m.user?.username?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white text-sm">{m.user?.nickname_rp || m.user?.username}</div>
                      <div className="text-xs text-discord-muted font-medium uppercase flex items-center gap-2">
                        {m.role} {m.status === 'pending' && <span className="text-discord-yellow text-[10px]">(En attente)</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Admin Settings Button */}
            {user.id === house.owner_id && (
              <button onClick={executeSell} className="w-full py-3 rounded-xl font-bold transition-colors bg-discord-red/20 text-discord-red hover:bg-discord-red/30 border border-discord-red/30">
                Revendre la propriété
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
