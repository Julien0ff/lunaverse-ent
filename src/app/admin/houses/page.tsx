'use client'

import { useState, useEffect } from 'react'
import { Home, Trash2, Loader2, Key } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminHousesPage() {
  const [houses, setHouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHouses()
  }, [])

  const fetchHouses = async () => {
    try {
      const res = await fetch('/api/admin/houses')
      const data = await res.json()
      if (res.ok) setHouses(data.items || data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const deleteHouse = async (houseId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette maison (Force Delete) ?')) return
    try {
      const { error } = await supabase.from('houses').delete().eq('id', houseId)
      if (error) throw error
      fetchHouses()
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-white"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">Gestion des Maisons</h1>
          <p className="text-discord-muted">Supervisez les propriétés achetées sur l'ENT.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map(house => (
          <div key={house.id} className="glass-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Home className="w-5 h-5 text-discord-blurple" />
                  {house.type}
                </h3>
                <p className="text-xs text-discord-muted">ID: {house.id.substring(0, 8)}...</p>
              </div>
              <button onClick={() => deleteHouse(house.id)} className="text-discord-red hover:bg-discord-red/20 p-2 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-black/20 rounded-xl">
              <div className="text-xs text-discord-muted uppercase mb-1">Propriétaire</div>
              <div className="flex items-center gap-2">
                {house.profiles?.avatar_url || house.owner?.avatar_url ? (
                  <img src={house.profiles?.avatar_url || house.owner?.avatar_url} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-discord-blurple/20" />
                )}
                <span className="font-bold text-white text-sm">
                  {house.profiles?.nickname_rp || house.owner?.nickname_rp || house.profiles?.username || house.owner?.username || 'Inconnu'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-black/10 p-2 rounded">
                <span className="text-discord-muted block text-[10px] uppercase">Surface</span>
                <span className="text-white font-medium">{house.sq_meters || house.square_meters} m²</span>
              </div>
              <div className="bg-black/10 p-2 rounded">
                <span className="text-discord-muted block text-[10px] uppercase">Catégorie Discord</span>
                <span className="text-white font-medium truncate">{house.discord_category_id || house.category_id || 'Non'}</span>
              </div>
            </div>
          </div>
        ))}
        {houses.length === 0 && (
          <div className="col-span-full text-center py-12 text-discord-muted glass-card">
            Aucune maison trouvée.
          </div>
        )}
      </div>
    </div>
  )
}
