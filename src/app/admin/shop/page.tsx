'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  type: string
  image_url: string
  stock: number | null
}

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Partial<ShopItem> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/shop/items')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setSaving(true)

    const isNew = !editingItem.id
    const method = isNew ? 'POST' : 'PATCH'
    
    try {
      const res = await fetch('/api/admin/shop', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      })

      if (res.ok) {
        setEditingItem(null)
        fetchItems()
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur de sauvegarde')
      }
    } catch (e) {
      alert('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objet ?')) return
    try {
      const res = await fetch(`/api/admin/shop?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems(items.filter(i => i.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <ShoppingBag className="text-discord-blurple w-8 h-8" />
            Gestion de la Boutique
          </h2>
          <p className="text-discord-muted mt-2">Créez ou modifiez les objets en vente sur le serveur.</p>
        </div>
        <button 
          onClick={() => setEditingItem({ type: 'item', price: 0, name: '', description: '' })}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" /> Ajouter un objet
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="glass-card relative group hover:border-discord-blurple/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 rounded-xl bg-black/40 overflow-hidden border border-white/5 flex items-center justify-center">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} width={64} height={64} className="object-cover" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-discord-muted" />
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingItem(item)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-discord-error/10 hover:bg-discord-error/20 rounded-lg transition-colors text-discord-error">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-white text-lg">{item.name}</h3>
              <p className="text-discord-muted text-xs line-clamp-2 mt-1">{item.description}</p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <span className="text-discord-blurple font-black">{item.price.toLocaleString()} €</span>
                <span className="text-xs uppercase tracking-widest font-black text-gray-500">{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edition */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card max-w-lg w-full relative animate-slideUp">
            <button 
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-discord-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black text-white mb-6">
              {editingItem.id ? 'Modifier un objet' : 'Créer un objet'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Nom de l'objet</label>
                <input 
                  type="text" value={editingItem.name || ''} 
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})} 
                  className="glass-input w-full mt-1" required 
                />
              </div>
              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Description</label>
                <textarea 
                  value={editingItem.description || ''} 
                  onChange={e => setEditingItem({...editingItem, description: e.target.value})} 
                  className="glass-input w-full mt-1 resize-none h-20" required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Prix (€)</label>
                  <input 
                    type="number" value={editingItem.price || 0} 
                    onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} 
                    className="glass-input w-full mt-1" required min="0" 
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Type</label>
                  <select 
                    value={editingItem.type || 'item'} 
                    onChange={e => setEditingItem({...editingItem, type: e.target.value})} 
                    className="glass-input w-full mt-1"
                  >
                    <option value="item">Objet normal</option>
                    <option value="food">Nourriture / Boisson</option>
                    <option value="role">Grade / Rôle</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">URL de l'image (Optionnel)</label>
                <input 
                  type="url" value={editingItem.image_url || ''} 
                  onChange={e => setEditingItem({...editingItem, image_url: e.target.value})} 
                  className="glass-input w-full mt-1" placeholder="https://..." 
                />
              </div>
              
              <div className="pt-4 flex gap-4">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Save className="w-5 h-5" /> Sauvegarder</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
