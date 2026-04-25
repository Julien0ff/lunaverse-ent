'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ShoppingBag, Tag, Search, Filter, ArrowUpRight, Clock, User, AlertCircle, CheckCircle2, Wallet } from 'lucide-react'
import Image from 'next/image'
import clsx from 'clsx'

export default function MarketPage() {
  const { profile, refreshProfile } = useAuth()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Sell state
  const [showSellModal, setShowSellModal] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const [sellingData, setSellingData] = useState({ item_id: '', price: '', image_url: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/market')
      const data = await res.json()
      if (data.items) setListings(data.items)
    } catch (e) {}
    setLoading(false)
  }

  const loadInventory = async () => {
    try {
      const res = await fetch('/api/market/inventory')
      const data = await res.json()
      if (data.items) setInventory(data.items)
    } catch (e) {}
  }

  const handleBuy = async (id: string) => {
    if (buyingId) return
    setBuyingId(id)
    setMsg(null)
    try {
      const res = await fetch(`/api/market/${id}/buy`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: 'Objet acheté avec succès !' })
        loadListings()
        refreshProfile()
      } else {
        setMsg({ type: 'error', text: data.error || 'Erreur lors de l\'achat' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Erreur de connexion' })
    }
    setBuyingId(null)
  }

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/market/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellingData)
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: 'Objet mis en vente !' })
        setShowSellModal(false)
        loadListings()
        refreshProfile()
      } else {
        setMsg({ type: 'error', text: data.error || 'Erreur' })
      }
    } catch (e) {}
    setSubmitting(false)
  }

  const filteredListings = listings.filter(l => 
    l.item.name.toLowerCase().includes(search.toLowerCase()) ||
    l.seller.username.toLowerCase().includes(search.toLowerCase())
  )

  // Listing Fee Preview
  const previewFee = sellingData.price ? (parseFloat(sellingData.price) * 0.05 + Math.pow(parseFloat(sellingData.price), 1.1) / 200).toFixed(2) : '0.00'

  return (
    <div className="page-container">
      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSellModal(false)} />
          <div className="glass-card w-full max-w-md relative z-10 animate-scaleIn p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Tag className="text-pink-500 w-6 h-6" />
                Vendre un objet
              </h2>
              <button onClick={() => setShowSellModal(false)} className="text-discord-muted hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSell} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-2 block">Objet à vendre</label>
                <select 
                  className="glass-input w-full bg-[#1e1f22]"
                  required
                  value={sellingData.item_id}
                  onChange={e => setSellingData({ ...sellingData, item_id: e.target.value })}
                >
                  <option value="">-- Sélectionner un objet --</option>
                  {inventory.map(inv => (
                    <option key={inv.item.id} value={inv.item.id}>{inv.item.name} ({inv.quantity} possédé{inv.quantity > 1 ? 's' : ''})</option>
                  ))}
                </select>
                {inventory.length === 0 && <p className="text-[10px] text-discord-error mt-2">Vous n&apos;avez aucun objet à vendre.</p>}
              </div>

              <div>
                <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-2 block">Prix de vente (€)</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  placeholder="0.00"
                  required
                  value={sellingData.price}
                  onChange={e => setSellingData({ ...sellingData, price: e.target.value })}
                />
                <p className="text-[10px] text-discord-muted mt-2">
                  Taxe de mise en vente : <span className="text-pink-400 font-bold">{previewFee}€</span>
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-2 block">Photo de l&apos;objet (Optionnel)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="URL de l'image (ex: canette de Monster)..."
                  value={sellingData.image_url}
                  onChange={e => setSellingData({ ...sellingData, image_url: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting || !sellingData.item_id}
                className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-discord-blurple/20 group"
              >
                {submitting ? 'Traitement...' : 'Publier l\'annonce'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="animate-slideIn mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
            <ShoppingBag className="text-pink-500 w-10 h-10" />
            Luna Market
          </h1>
          <p className="text-discord-muted mt-2">La place de marché entre citoyens de LunaVerse.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => { setShowSellModal(true); loadInventory(); }}
            className="btn bg-pink-500 hover:bg-pink-400 text-white px-8 py-4 rounded-3xl flex items-center gap-3 shadow-xl shadow-pink-500/20 group"
          >
            <Tag className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Vendre un objet
          </button>

          <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-discord-success/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-discord-success" />
            </div>
            <div>
              <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest">Votre Solde</p>
              <p className="text-xl font-black text-white tracking-tight">{profile?.balance?.toLocaleString() || 0} €</p>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={clsx(
          "mb-8 p-4 rounded-2xl text-sm font-bold animate-fadeIn flex items-center gap-3 border",
          msg.type === 'success' ? "bg-discord-success/10 text-discord-success border-discord-success/20" : "bg-discord-error/10 text-discord-error border-discord-error/20"
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      {/* Search & Filter */}
      <div className="glass-card mb-8 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-discord-muted" />
          <input 
            type="text" 
            placeholder="Rechercher un objet ou un vendeur..." 
            className="glass-input !pl-12"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 px-6">
          <Filter className="w-5 h-5" />
          Filtres
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20"><div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filteredListings.length === 0 ? (
        <div className="glass-card text-center py-20 opacity-50 border-dashed">
          <Tag className="w-16 h-16 mx-auto mb-4 text-discord-muted" />
          <p className="text-xl font-bold text-white">Aucun objet en vente pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map(listing => (
            <div key={listing.id} className="glass-card group overflow-hidden flex flex-col hover:border-pink-500/50 transition-all hover:translate-y-[-4px] shadow-xl">
              {/* Image */}
              <div className="aspect-square relative bg-gradient-to-br from-white/5 to-transparent overflow-hidden">
                {listing.image_url || listing.item.image_url ? (
                  <Image src={listing.image_url || listing.item.image_url} alt={listing.item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📦</div>
                )}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                   <Tag className="w-3 h-3 text-pink-400" />
                   <span className="text-xs font-black text-white">{listing.item.category}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-6 h-6 rounded-full overflow-hidden relative ring-1 ring-white/10">
                      <Image src={listing.seller.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} fill alt="" />
                   </div>
                   <span className="text-[10px] font-black text-discord-muted uppercase tracking-widest truncate">Vendu par {listing.seller.nickname_rp || listing.seller.username}</span>
                </div>

                <h3 className="text-xl font-black text-white mb-1 group-hover:text-pink-400 transition-colors">{listing.item.name}</h3>
                <p className="text-xs text-discord-muted line-clamp-2 mb-6 flex-1 italic">&quot;{listing.item.description}&quot;</p>
                
                <div className="flex items-center justify-between gap-4 mt-auto">
                   <div>
                      <p className="text-[10px] font-black text-discord-muted uppercase tracking-[0.2em] mb-0.5">Prix demandé</p>
                      <p className="text-2xl font-black text-white tracking-tighter">{listing.price.toLocaleString()} €</p>
                   </div>
                   <button 
                     onClick={() => handleBuy(listing.id)}
                     disabled={buyingId === listing.id || listing.seller_id === profile?.id}
                     className={clsx(
                       "btn py-2 px-5 text-sm font-black rounded-2xl shadow-lg transition-all",
                       listing.seller_id === profile?.id 
                         ? "bg-white/5 text-discord-muted cursor-not-allowed border border-white/5" 
                         : "bg-pink-500 hover:bg-pink-400 text-white shadow-pink-500/20"
                     )}
                   >
                     {buyingId === listing.id ? '...' : listing.seller_id === profile?.id ? 'Votre offre' : 'Acheter'}
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
