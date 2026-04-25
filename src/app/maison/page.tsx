'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Home, Plus, Users, ShieldAlert, CheckCircle2, Clock, Trash2, UserPlus, Settings2, Info } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

export default function MaisonPage() {
  const { profile } = useAuth()
  const [house, setHouse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requestName, setRequestName] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Management states
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'settings'>('info')

  useEffect(() => {
    loadHouse()
  }, [])

  const loadHouse = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/houses')
      const data = await res.json()
      if (data.house) setHouse(data.house)
    } catch (e) {}
    setLoading(false)
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: requestName })
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: 'Demande envoyée avec succès !' })
        loadHouse()
      } else {
        setMsg({ type: 'error', text: data.error || 'Erreur' })
      }
    } catch (e) {}
    setSubmitting(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-discord-blurple border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="page-container max-w-6xl mx-auto">
      <div className="animate-slideIn mb-8">
        <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
          <Home className="text-discord-blurple w-10 h-10" />
          Ma Maison
        </h1>
        <p className="text-discord-muted mt-2">Gérez votre propriété privée et vos accès.</p>
      </div>

      {msg && (
        <div className={clsx(
          "mb-8 p-4 rounded-2xl text-sm font-bold animate-fadeIn flex items-center gap-3 border",
          msg.type === 'success' ? "bg-discord-success/10 text-discord-success border-discord-success/20" : "bg-discord-error/10 text-discord-error border-discord-error/20"
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          {msg.text}
        </div>
      )}

      {!house ? (
        <div className="glass-card p-12 text-center animate-scaleIn">
          <div className="w-24 h-24 bg-discord-blurple/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="w-12 h-12 text-discord-blurple" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Devenez Propriétaire</h2>
          <p className="text-discord-muted max-w-md mx-auto mb-10">Faites une demande pour obtenir votre propre maison privée sur LunaVerse. Une fois validée, un salon Discord vous sera dédié.</p>
          
          <form onSubmit={handleRequest} className="max-w-md mx-auto">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-2 block text-left">Nom de votre Maison</label>
                <input 
                  type="text" 
                  className="glass-input text-center text-xl font-bold" 
                  placeholder="Ex: Villa de Julien..."
                  required
                  value={requestName}
                  onChange={e => setRequestName(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-discord-blurple/30 group"
              >
                {submitting ? 'Envoi...' : 'Soumettre ma demande'}
              </button>
            </div>
          </form>
        </div>
      ) : house.status === 'pending' ? (
        <div className="glass-card p-12 text-center border-discord-warning/20 animate-scaleIn">
          <div className="w-24 h-24 bg-discord-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-discord-warning animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Demande en Cours</h2>
          <p className="text-discord-muted mb-2">Votre demande pour la maison <span className="text-white font-bold">&quot;{house.name}&quot;</span> est en cours d&apos;examen.</p>
          <p className="text-sm text-discord-muted opacity-60">L&apos;administration validera votre demande prochainement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-2">
              <button 
                onClick={() => setActiveTab('info')}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                  activeTab === 'info' ? "bg-discord-blurple text-white" : "text-discord-muted hover:bg-white/5"
                )}
              >
                <Info className="w-5 h-5" />
                Informations
              </button>
              <button 
                onClick={() => setActiveTab('members')}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                  activeTab === 'members' ? "bg-discord-blurple text-white" : "text-discord-muted hover:bg-white/5"
                )}
              >
                <Users className="w-5 h-5" />
                Résidents & Accès
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                  activeTab === 'settings' ? "bg-discord-blurple text-white" : "text-discord-muted hover:bg-white/5"
                )}
              >
                <Settings2 className="w-5 h-5" />
                Aménagements
              </button>
            </div>

            <div className="glass-card p-6 bg-gradient-to-br from-discord-blurple/10 to-transparent">
              <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-4">Statut Propriété</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-discord-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-discord-success" />
                </div>
                <div>
                  <p className="text-white font-black">Actif</p>
                  <p className="text-[10px] text-discord-muted">ID: {house.discord_channel_id || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'info' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-card p-8 bg-black/40 overflow-hidden relative">
                   <div className="absolute -top-12 -right-12 w-48 h-48 bg-discord-blurple/10 rounded-full blur-3xl" />
                   <h2 className="text-4xl font-black text-white mb-2">{house.name}</h2>
                   <p className="text-discord-muted font-medium mb-8">Votre sanctuaire privé sur LunaVerse.</p>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Catégorie</p>
                        <p className="text-xl font-bold text-white">Résidentiel</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Meubles installés</p>
                        <p className="text-xl font-bold text-white">{Object.keys(house.furnishings || {}).length} Objet(s)</p>
                      </div>
                   </div>
                </div>

                <div className="glass-card p-6 border-dashed border-white/10 opacity-60">
                   <p className="text-sm italic text-center">Plus de détails et d&apos;options de personnalisation bientôt disponibles.</p>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-white">Whitelist (Accès autorisés)</h3>
                    <button className="btn bg-discord-blurple hover:bg-discord-blurple-dark text-white px-4 py-2 text-xs flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>
                  <div className="text-center py-10 text-discord-muted border border-dashed border-white/10 rounded-2xl">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Personne n&apos;est dans votre whitelist pour le moment.</p>
                  </div>
                </div>

                <div className="glass-card p-8 border-discord-error/20">
                   <h3 className="text-xl font-black text-discord-error mb-8">Blacklist (Interdits)</h3>
                   <div className="text-center py-6 text-discord-muted italic text-xs">
                     La liste est vide.
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn">
                {[
                  { id: 'frigo', name: 'Réfrigérateur', icon: '❄️', desc: 'Permet de stocker de la nourriture.' },
                  { id: 'bed', name: 'Lit King Size', icon: '🛏️', desc: 'Permet d&apos;utiliser la commande /dormir.' },
                  { id: 'tv', name: 'Home Cinéma', icon: '📺', desc: 'Ambiance sonore exclusive.' },
                  { id: 'safe', name: 'Coffre Fort', icon: '🔒', desc: 'Stockage d&apos;argent liquide sécurisé.' }
                ].map(item => (
                  <div key={item.id} className="glass-card p-6 flex items-start gap-4 hover:border-white/20 transition-all opacity-50 group">
                    <div className="text-4xl">{item.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-white mb-1">{item.name}</h4>
                      <p className="text-xs text-discord-muted mb-4">{item.desc}</p>
                      <button className="text-[10px] font-black text-discord-muted uppercase tracking-widest group-hover:text-discord-blurple transition-colors">Non possédé</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
