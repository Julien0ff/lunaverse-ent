'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/context/AuthContext'
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  CheckCircle, AlertCircle, X, ShoppingBag, Tag, Lightbulb, Send, Check
} from 'lucide-react'
import clsx from 'clsx'

interface ShopItem {
  id: string; name: string; description: string
  price: number; category: string; is_available: boolean
}
interface CartItem extends ShopItem { quantity: number }

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔', drink: '🥤', snack: '🍿', clothing: '👕',
  luxury: '💎', special: '⭐', other: '📦',
}
const CATEGORY_LABELS: Record<string, string> = {
  food: 'Nourriture', drink: 'Boissons', snack: 'Snacks',
  clothing: 'Vêtements & Lifestyle', luxury: 'Luxe', special: 'Spéciaux', other: 'Divers',
}

function getEmoji(item: ShopItem) {
  const n = item.name.toLowerCase()
  if (n.includes('burger') || n.includes('sandwich')) return '🍔'
  if (n.includes('pizza')) return '🍕'
  if (n.includes('frites')) return '🍟'
  if (n.includes('wrap')) return '🌯'
  if (n.includes('salade')) return '🥗'
  if (n.includes('croque')) return '🥪'
  if (n.includes('cola') || n.includes('coca')) return '🥤'
  if (n.includes('eau')) return '💧'
  if (n.includes('café')) return '☕'
  if (n.includes('bière') || n.includes('pression')) return '🍺'
  if (n.includes('bull') || n.includes('energy')) return '⚡'
  if (n.includes('smoothie')) return '🍹'
  if (n.includes('jus')) return '🍊'
  if (n.includes('chips')) return '🍿'
  if (n.includes('chocolat') || n.includes('barre')) return '🍫'
  if (n.includes('bonbon')) return '🍬'
  if (n.includes('madeleine') || n.includes('croissant')) return '🥐'
  if (n.includes('clope') || n.includes('cigarette')) return '🚬'
  if (n.includes('briquet')) return '🔥'
  if (n.includes('hoodie') || n.includes('vêtement')) return '👕'
  if (n.includes('casquette')) return '🧢'
  if (n.includes('sac')) return '🎒'
  if (n.includes('lottery') || n.includes('billet')) return '🎟️'
  if (n.includes('vip')) return '👑'
  if (n.includes('voiture')) return '🏎️'
  if (n.includes('montre')) return '⌚'
  if (n.includes('dom pérignon') || n.includes('champagne')) return '🍾'
  return CATEGORY_ICONS[item.category] || '📦'
}

export default function ShopPage() {
  const { profile, refreshProfile } = useAuth()
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [purchasing, setPurchasing] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop')
  const [inventory, setInventory] = useState<any[]>([])
  // Suggestion modal
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestion, setSuggestion] = useState({ name: '', description: '', category: '', price: '' })
  const [suggesting, setSuggesting] = useState(false)

  useEffect(() => {
    fetch('/api/shop/items')
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(console.error)
      .finally(() => setLoading(false))

    // Fetch inventory
    fetch('/api/shop/inventory')
      .then(r => r.json())
      .then(d => setInventory(d.items || []))
      .catch(console.error)
  }, [profile?.id])

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Cart logic
  const addToCart = (item: ShopItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id))

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
      .filter(c => c.quantity > 0)
    )
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)
  const canAfford = (profile?.balance ?? 0) >= cartTotal
  const cartEmpty = cart.length === 0

  const checkout = async () => {
    if (!canAfford || cartEmpty || purchasing) return
    setPurchasing(true)
    setCartOpen(false)

    try {
      const results = await Promise.all(
        cart.map(c =>
          fetch('/api/shop/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: c.id, quantity: c.quantity }),
          }).then(r => r.json())
        )
      )

      const errors = results.filter(r => r.error)
      if (errors.length === 0) {
        showToast('success', `✓ ${cartCount} article(s) acheté(s) — ${cartTotal.toFixed(0)} € débités !`)
        setCart([])
        await refreshProfile()
        // Refresh inventory
        fetch('/api/shop/inventory').then(r => r.json()).then(d => setInventory(d.items || []))
      } else {
        showToast('error', errors[0].error || 'Erreur lors de l&apos;achat.')
      }
    } catch {
      showToast('error', 'Erreur de connexion.')
    } finally {
      setPurchasing(false)
    }
  }

  // Discard item from inventory
  const discardItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Jeter 1x ${itemName} ?`)) return
    try {
      const res = await fetch('/api/shop/inventory/discard', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, quantity: 1 }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast('success', d.message || 'Article jeté')
        fetch('/api/shop/inventory').then(r => r.json()).then(d => setInventory(d.items || []))
      } else {
        showToast('error', d.error || 'Erreur')
      }
    } catch {
      showToast('error', 'Erreur de connexion.')
    }
  }

  // Submit suggestion
  const submitSuggestion = async () => {
    if (!suggestion.name.trim()) return
    setSuggesting(true)
    try {
      const res = await fetch('/api/admin/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggestion.name,
          description: suggestion.description,
          category: suggestion.category,
          estimated_price: suggestion.price ? Number(suggestion.price) : undefined,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast('success', d.message || 'Suggestion envoyée !')
        setSuggestOpen(false)
        setSuggestion({ name: '', description: '', category: '', price: '' })
      } else {
        showToast('error', d.error || 'Erreur')
      }
    } catch {
      showToast('error', 'Erreur de connexion.')
    } finally {
      setSuggesting(false)
    }
  }

  // Filters
  const categories = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))]
  const filtered = items
    .filter(i => i.is_available)
    .filter(i => activeCategory === 'all' || i.category === activeCategory)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="page-container">

      {/* ── Portals : montés dans document.body, hors de tout ancêtre transform ── */}
      {typeof document !== 'undefined' && (
        <>
          {/* Toast */}
          {toast && createPortal(
            <div
              className={clsx(
                'fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold shadow-2xl border animate-scaleIn',
                toast.type === 'success'
                  ? 'bg-discord-success/15 text-discord-success border-discord-success/25'
                  : 'bg-discord-error/15 text-discord-error border-discord-error/25'
              )}
            >
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {toast.text}
              <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>,
            document.body
          )}

          {/* Cart sidebar overlay */}
          {cartOpen && createPortal(
            <div className="fixed inset-0 z-[500] flex">
              {/* Backdrop */}
              <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
              {/* Panel */}
              <div className="w-full max-w-sm bg-discord-darker border-l border-white/8 flex flex-col shadow-2xl animate-slideInRight">

                {/* Cart header */}
                <div className="flex items-center justify-between p-6 border-b border-white/8">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-discord-blurple" />
                    <h2 className="text-xl font-black text-white">Panier</h2>
                    {cartCount > 0 && (
                      <span className="px-2 py-0.5 bg-discord-blurple rounded-full text-xs font-black text-white">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4 text-discord-muted" />
                  </button>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cartEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                      <span className="text-6xl">🛒</span>
                      <p className="text-discord-muted font-bold text-center">Votre panier est vide.<br />Ajoutez des articles !</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-white/4 rounded-2xl border border-white/6 group">
                        <span className="text-2xl w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl flex-shrink-0">
                          {getEmoji(item)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">{item.name}</p>
                          <p className="text-discord-success text-xs font-black">{(item.price * item.quantity).toFixed(0)} €</p>
                        </div>
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3 text-discord-muted" />
                          </button>
                          <span className="w-6 text-center text-sm font-black text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white/8 hover:bg-discord-blurple/30 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3 text-discord-muted hover:text-white" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-7 h-7 rounded-lg bg-discord-error/10 hover:bg-discord-error/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-discord-error" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart footer */}
                {!cartEmpty && (
                  <div className="p-5 border-t border-white/8 space-y-4">
                    {/* Balance info */}
                    <div className="flex justify-between items-center text-xs font-bold text-discord-muted">
                      <span>Votre solde</span>
                      <span className="text-white">{(profile?.balance ?? 0).toFixed(0)} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white">Total</span>
                      <span className={clsx('text-2xl font-black', canAfford ? 'text-discord-success' : 'text-discord-error')}>
                        {cartTotal.toFixed(0)} €
                      </span>
                    </div>
                    {!canAfford && (
                      <p className="text-discord-error text-xs font-bold text-center bg-discord-error/8 py-2 rounded-xl border border-discord-error/15">
                        ⚠️ Solde insuffisant — il vous manque {(cartTotal - (profile?.balance ?? 0)).toFixed(0)} €
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => { setCart([]); setCartOpen(false) }}
                        className="btn btn-ghost py-3 text-sm"
                      >
                        Vider
                      </button>
                      <button
                        onClick={checkout}
                        disabled={!canAfford || purchasing}
                        className="btn btn-primary py-3 text-sm"
                      >
                        {purchasing
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><ShoppingBag className="w-4 h-4" /> Commander</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
        </>
      )}

      {/* ── Floating Cart Button (Bottom Right) ── */}
      {cartCount > 0 && typeof document !== 'undefined' && createPortal(
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-8 right-8 z-[400] flex items-center justify-center w-16 h-16 bg-discord-blurple hover:bg-discord-blurple-dark text-white rounded-full shadow-[0_0_20px_rgba(88,101,242,0.4)] hover:shadow-[0_0_30px_rgba(88,101,242,0.6)] hover:scale-110 transition-all animate-bounce-subtle group"
        >
          <ShoppingCart className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-discord-error border-2 border-discord-dark rounded-full text-xs font-black flex items-center justify-center">
            {cartCount}
          </span>
        </button>,
        document.body
      )}

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="animate-slideIn">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <ShoppingCart className="w-10 h-10 text-discord-blurple" />
              Boutique
            </h1>
            <p className="text-discord-muted mt-1 font-medium">Dépensez vos Euros LunaVerse ici !</p>
          </div>
          {/* Solde + Cart button */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-discord-blurple/12 border border-discord-blurple/20 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-discord-success animate-pulse" />
              <span className="text-sm font-bold text-white">{(profile?.balance ?? 0).toFixed(0)} €</span>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 bg-discord-blurple hover:bg-discord-blurple-dark rounded-xl font-bold text-white text-sm transition-all shadow-lg shadow-discord-blurple/25 hover:shadow-discord-blurple/40 hover:scale-105"
            >
              <ShoppingCart className="w-4 h-4" />
              Panier
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-discord-error rounded-full text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + Suggestion button */}
      <div className="flex items-center gap-3 flex-wrap animate-slideIn mt-4 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2 sm:gap-4 bg-white/5 p-1 rounded-2xl border border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('shop')}
            className={clsx(
              "flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap",
              activeTab === 'shop' ? "bg-discord-blurple text-white shadow-lg" : "text-discord-muted hover:text-white hover:bg-white/5"
            )}
          >
            🏪 Boutique
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={clsx(
              "flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all whitespace-nowrap",
              activeTab === 'inventory' ? "bg-purple-500 text-white shadow-lg" : "text-discord-muted hover:text-white hover:bg-white/5"
            )}
          >
            🎒 Mon Inventaire
          </button>
        </div>
        <button
          onClick={() => setSuggestOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:text-yellow-300 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm"
        >
          <Lightbulb className="w-4 h-4" />
          Suggérer un article
        </button>
      </div>


      {/* ── Filters ─────────────────────────────────────────────── */}
      {activeTab === 'shop' && <div className="flex flex-col sm:flex-row gap-3 animate-fadeIn mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-discord-muted" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-discord-blurple/50 focus:bg-white/10 transition-all font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'px-3 sm:px-4 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight sm:tracking-widest transition-all whitespace-nowrap border',
                activeCategory === cat
                  ? 'bg-white/10 border-white/20 text-white shadow-sm'
                  : 'bg-transparent border-white/5 text-discord-muted hover:text-white hover:border-white/10'
              )}
            >
              {cat === 'all' ? '🏪 Tout' : `${CATEGORY_ICONS[cat] || '📦'} ${CATEGORY_LABELS[cat] || cat}`}
            </button>
          ))}
        </div>
      </div>}

      {/* ── Cart summary bar (if items in cart) ─────────────────── */}
      {cartCount > 0 && activeTab === 'shop' && (
        <button
          onClick={() => setCartOpen(true)}
          className="w-full flex items-center justify-between px-5 py-4 mt-6 bg-discord-blurple/12 border border-discord-blurple/25 rounded-2xl hover:bg-discord-blurple/20 transition-all animate-scaleIn"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-discord-blurple" />
            <span className="font-black text-white">{cartCount} article(s) dans le panier</span>
          </div>
          <span className="font-black text-discord-success text-lg">{cartTotal.toFixed(0)} €</span>
        </button>
      )}

      {/* ── Skeleton loading ─────────────────────────────────────── */}
      {loading && activeTab === 'shop' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shop-item-card animate-pulse">
              <div className="h-28 bg-white/5" />
              <div className="shop-item-body space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-8 bg-white/5 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {!loading && activeTab === 'shop' && filtered.length === 0 && (
        <div className="text-center py-20 animate-fadeIn mt-8">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-white mb-2">Aucun article trouvé</h2>
          <p className="text-discord-muted">
            {items.length === 0 ? 'La boutique sera bientôt garnie !' : 'Aucun article ne correspond à votre recherche.'}
          </p>
        </div>
      )}

      {/* ── Items grid ──────────────────────────────────────────── */}
      {!loading && activeTab === 'shop' && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filtered.map((item, i) => {
            const canAffordItem = (profile?.balance ?? 0) >= item.price
            const inCart = cart.find(c => c.id === item.id)

            return (
              <div
                key={item.id}
                className={clsx('shop-item-card animate-fadeIn group transition-all flex flex-col', !canAffordItem && 'opacity-60')}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Thumbnail */}
                <div className="shop-item-thumb relative h-32 flex items-center justify-center p-4">
                  <span className="select-none text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">{getEmoji(item)}</span>
                  {/* In-cart badge */}
                  {inCart && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-discord-blurple rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg ring-2 ring-black/20">
                      {inCart.quantity}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="shop-item-body flex-1 flex flex-col p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="w-3 h-3 text-discord-muted" />
                    <span className="text-[10px] font-black text-discord-muted uppercase tracking-widest truncate">
                      {CATEGORY_LABELS[item.category?.toLowerCase()] || item.category || 'Divers'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-tight mb-2 truncate">{item.name}</h3>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-auto pt-2 gap-2">
                    <p className={clsx('text-base sm:text-lg font-black', canAffordItem ? 'text-discord-success' : 'text-discord-error')}>
                      {item.price.toFixed(0)} €
                    </p>
                    <button
                      onClick={() => canAffordItem && addToCart(item)}
                      disabled={!canAffordItem}
                      className={clsx(
                        'btn text-[10px] sm:text-xs py-2 px-3 flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto',
                        canAffordItem ? 'btn-primary hover:scale-105' : 'btn-ghost opacity-50 pointer-events-none'
                      )}
                      id={`add-${item.id}`}
                    >
                      {canAffordItem ? (
                        <><Plus className="w-3.5 h-3.5" /> Ajouter</>
                      ) : 'Trop cher'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Cart Drawer (Mobile) ─────────────────────────────────── */}
      {cartOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] sm:w-80 bg-discord-dark flex flex-col shadow-2xl animate-slideLeft">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-discord-blurple" />
                Votre Panier
              </h2>
              <button onClick={() => setCartOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cartEmpty ? (
                <div className="text-center py-20 text-discord-muted">
                  <ShoppingCart className="w-16 h-16 opacity-10 mx-auto mb-4" />
                  <p className="font-bold">Panier vide</p>
                </div>
              ) : (
                cart.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 relative">
                      <div className="text-3xl w-12 h-12 flex items-center justify-center bg-black/20 rounded-xl">
                        {getEmoji(c)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{c.name}</h4>
                        <p className="text-xs text-discord-muted mt-0.5">{c.price.toFixed(0)} € / u</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                           <button onClick={() => updateQty(c.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-md"><Minus className="w-3 h-3" /></button>
                           <span className="text-xs font-black text-white min-w-[20px] text-center">{c.quantity}</span>
                           <button onClick={() => updateQty(c.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-md"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeFromCart(c.id)} className="p-1 px-2 text-[10px] font-black text-discord-error uppercase">Supprimer</button>
                      </div>
                  </div>
                ))
              )}
            </div>

            {!cartEmpty && (
              <div className="p-4 border-t border-white/5 bg-black/20 pb-safe">
                <div className="flex justify-between items-end mb-4">
                  <p className="text-xs font-black text-discord-muted uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-black text-discord-success">{cartTotal.toFixed(0)} €</p>
                </div>
                <button
                  onClick={checkout}
                  disabled={purchasing || !canAfford}
                  className="w-full btn btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black shadow-xl"
                >
                  {purchasing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-5 h-5" /> Payer maintenant</>}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── Cart Sidebar (Desktop Only) ────────────────────────── */}
      <div className="hidden lg:block w-80 flex-shrink-0 animate-fadeIn">
        <div className="sticky top-8 w-full glass-card p-6 border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100vh-6rem)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-discord-blurple/20 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-discord-blurple" />
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">Votre Panier</h2>
            </div>
            {!cartEmpty && <span className="text-[10px] font-black bg-discord-blurple text-white px-2 py-0.5 rounded-full">{cartCount}</span>}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
            {cartEmpty ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-white/5 mx-auto mb-3" />
                <p className="text-sm text-discord-muted font-bold">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(c => (
                  <div key={c.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 group relative animate-slideIn">
                      <div className="text-2xl w-10 h-10 flex items-center justify-center bg-black/20 rounded-xl">{getEmoji(c)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                        <p className="text-[10px] text-discord-muted mt-0.5">{c.price.toFixed(0)} € / u</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => updateQty(c.id, -1)} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded-md hover:bg-discord-error/20 hover:text-discord-error"><Minus size={12} /></button>
                          <button onClick={() => updateQty(c.id, 1)} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded-md hover:bg-discord-success/20 hover:text-discord-success"><Plus size={12} /></button>
                        </div>
                        <span className="text-xs font-black text-white px-2 py-1 bg-white/5 rounded-lg">x{c.quantity}</span>
                      </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!cartEmpty && (
            <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-xs font-black text-discord-muted uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-discord-success">{cartTotal.toFixed(0)} €</p>
              </div>
              <button
                onClick={checkout}
                disabled={purchasing || !canAfford}
                className="w-full btn btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl hover:scale-[1.02]"
              >
                {purchasing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Acheter</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Inventory grid ────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="animate-fadeIn mt-8">
          {inventory.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
              <div className="text-6xl mb-4">🎒</div>
              <p className="text-white font-black text-xl mb-1">Votre inventaire est vide.</p>
              <p className="text-discord-muted">Passez à la boutique pour rafler quelques articles !</p>
              <button onClick={() => setActiveTab('shop')} className="btn btn-primary mt-6">Aller à la boutique</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {inventory.map(item => {
                const isDrink = ['drink', 'drinks', 'beer', 'alcohol'].includes(item.category?.toLowerCase())
                const liters = isDrink ? (item.count * 0.33).toFixed(2) + ' L' : null

                return (
                  <div key={item.id} className="relative p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-discord-blurple/50 hover:bg-white/10 transition-colors group flex flex-col items-center justify-center">
                    {/* Quantity badge */}
                    <div className="absolute top-3 left-3 bg-discord-blurple text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md leading-none">
                      x{item.count}
                    </div>
                    {/* Discard button */}
                    <button
                      onClick={() => discardItem(item.item_id || item.id, item.name)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-discord-error/0 hover:bg-discord-error/20 border border-discord-error/0 hover:border-discord-error/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      title="Jeter"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-discord-error" />
                    </button>

                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform select-none">
                      {getEmoji(item)}
                    </div>
                    <p className="text-sm font-black text-white text-center leading-tight mb-1 truncate w-full">{item.name}</p>
                    <p className="text-[10px] font-bold text-discord-muted uppercase tracking-widest text-center">
                      {CATEGORY_LABELS[item.category?.toLowerCase()] || item.category || 'Objet'}
                    </p>
                    {liters && (
                      <p className="text-xs font-black text-blue-400 mt-1">💧 {liters}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Suggestion modal ─────────────────────────────────────── */}
      {suggestOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-discord-darker border border-white/12 rounded-3xl p-6 shadow-2xl animate-scaleIn space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-black text-white">Suggerérer un article</h2>
              </div>
              <button onClick={() => setSuggestOpen(false)} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-discord-muted" />
              </button>
            </div>
            <p className="text-sm text-discord-muted">Votre suggestion sera envoyée directement aux admins dans l&apos;onglet Boutique.</p>
            <div className="space-y-3">
              <input
                className="glass-input"
                placeholder="Nom de l&apos;article *"
                value={suggestion.name}
                onChange={e => setSuggestion(s => ({ ...s, name: e.target.value }))}
              />
              <textarea
                className="glass-input resize-none"
                placeholder="Description (optionnel)"
                rows={3}
                value={suggestion.description}
                onChange={e => setSuggestion(s => ({ ...s, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="glass-input"
                  value={suggestion.category}
                  onChange={e => setSuggestion(s => ({ ...s, category: e.target.value }))}
                >
                  <option value="">Catégorie...</option>
                  <option value="food">Nourriture</option>
                  <option value="drink">Boissons</option>
                  <option value="snack">Snacks</option>
                  <option value="clothing">Vêtements</option>
                  <option value="luxury">Luxe</option>
                  <option value="special">Spéciaux</option>
                  <option value="other">Divers</option>
                </select>
                <input
                  className="glass-input"
                  type="number"
                  placeholder="Prix estimé (€)"
                  value={suggestion.price}
                  onChange={e => setSuggestion(s => ({ ...s, price: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSuggestOpen(false)} className="btn btn-ghost flex-1">Annuler</button>
              <button
                onClick={submitSuggestion}
                disabled={!suggestion.name.trim() || suggesting}
                className="btn btn-primary flex-1"
              >
                {suggesting
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Send className="w-4 h-4" /> Envoyer 💎</>
                }
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
