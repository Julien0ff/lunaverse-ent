'use client'

import { useState, useEffect } from 'react'
import { Clock, Send, Utensils, Info, CheckCircle2, Loader2, Save, Trash2, CalendarDays } from 'lucide-react'
import clsx from 'clsx'

export default function AdminCantinePage() {
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [deploying, setDeploying] = useState(false)
  
  const [startTime, setStartTime] = useState('11:30')
  const [endTime, setEndTime] = useState('13:30')
  const [menuChannelId, setMenuChannelId] = useState('')
  const [rpChannelId, setRpChannelId] = useState('')
  const [feedback, setFeedback] = useState('')

  const [menus, setMenus] = useState<any[]>([])
  const [menuDate, setMenuDate] = useState('')
  const [starter, setStarter] = useState('')
  const [main, setMain] = useState('')
  const [side, setSide] = useState('')
  const [dessert, setDessert] = useState('')
  const [addingMenu, setAddingMenu] = useState(false)

  useEffect(() => {
    loadSettings()
    loadMenus()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/cantine')
      if (res.ok) {
        const data = await res.json()
        setStartTime(data.cantine_start_time || '11:30')
        setEndTime(data.cantine_end_time || '13:30')
        setMenuChannelId(data.discord_canteen_menu_channel_id || '')
        setRpChannelId(data.cantine_channel_id || '')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadMenus = async () => {
    try {
      const res = await fetch('/api/cantine/menu')
      if (res.ok) {
        const data = await res.json()
        setMenus(data.menus || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    showFeedback('')
    try {
      const res = await fetch('/api/admin/cantine', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cantine_start_time: startTime, 
          cantine_end_time: endTime, 
          discord_canteen_menu_channel_id: menuChannelId,
          cantine_channel_id: rpChannelId
        })
      })
      if (res.ok) {
        showFeedback('✅ Paramètres sauvegardés !')
      } else {
        showFeedback('❌ Erreur de sauvegarde.')
      }
    } catch (e) {
      showFeedback('❌ Erreur de connexion.')
    } finally {
      setSavingSettings(false)
    }
  }

  const addMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuDate || !main) return
    setAddingMenu(true)
    try {
      const res = await fetch('/api/cantine/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_date: menuDate,
          time_start: startTime,
          time_end: endTime,
          starter, main, side, dessert
        })
      })
      if (res.ok) {
        showFeedback('✅ Menu ajouté !')
        setMenuDate('')
        setStarter('')
        setMain('')
        setSide('')
        setDessert('')
        loadMenus()
      } else {
        const err = await res.json()
        showFeedback(`❌ Erreur: ${err.error}`)
      }
    } catch (e) {
      showFeedback('❌ Erreur de connexion.')
    } finally {
      setAddingMenu(false)
    }
  }

  const deleteMenu = async (id: string) => {
    try {
      const res = await fetch(`/api/cantine/menu?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadMenus()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const deployMenu = async () => {
    setDeploying(true)
    showFeedback('')
    try {
      const res = await fetch('/api/admin/cantine/deploy', { method: 'POST' })
      if (res.ok) {
        showFeedback('✅ Menus déployés sur Discord !')
      } else {
        const err = await res.json()
        showFeedback(`❌ Erreur: ${err.error || 'Impossible de déployer.'}`)
      }
    } catch (e) {
      showFeedback('❌ Erreur lors du déploiement.')
    } finally {
      setDeploying(false)
    }
  }

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 4000)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-discord-blurple" /></div>

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <Utensils className="text-discord-blurple w-8 h-8" />
          Gestion de la Cantine
        </h2>
        <p className="text-discord-muted mt-2">Préparez les menus de la semaine et déployez-les sur Discord.</p>
      </div>

      {feedback && (
        <div className={clsx(
          "p-4 rounded-xl font-bold flex items-center gap-2",
          feedback.includes('✅') ? "bg-discord-success/10 text-discord-success border border-discord-success/20" : "bg-discord-error/10 text-discord-error border border-discord-error/20"
        )}>
          {feedback.includes('✅') ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Paramètres & Ajout Menu */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Horaires & Discord
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-discord-muted uppercase tracking-wider">Ouverture</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-discord-muted uppercase tracking-wider">Fermeture</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Salon Cantine (RP)</label>
                <input
                  type="text"
                  value={rpChannelId}
                  onChange={e => setRpChannelId(e.target.value)}
                  placeholder="ID Discord"
                  className="glass-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest block">Salon Annonces Menus</label>
                <input
                  type="text"
                  value={menuChannelId}
                  onChange={e => setMenuChannelId(e.target.value)}
                  placeholder="ID Discord"
                  className="glass-input w-full"
                />
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="btn bg-white/10 hover:bg-white/20 text-white w-full py-3 font-bold flex items-center justify-center gap-2"
            >
              {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Sauvegarder
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <CalendarDays className="w-5 h-5 text-discord-success" /> Ajouter un menu
            </h3>
            <form onSubmit={addMenu} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Date</label>
                <input type="date" value={menuDate} onChange={e => setMenuDate(e.target.value)} className="glass-input w-full" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Entrée</label>
                <input type="text" value={starter} onChange={e => setStarter(e.target.value)} className="glass-input w-full" placeholder="Salade..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Plat Principal (Requis)</label>
                <input type="text" value={main} onChange={e => setMain(e.target.value)} className="glass-input w-full" placeholder="Poulet frites..." required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Laitage / Fromage</label>
                <input type="text" value={side} onChange={e => setSide(e.target.value)} className="glass-input w-full" placeholder="Camembert..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-discord-muted uppercase tracking-widest">Dessert</label>
                <input type="text" value={dessert} onChange={e => setDessert(e.target.value)} className="glass-input w-full" placeholder="Tarte aux pommes..." />
              </div>
              <button type="submit" disabled={addingMenu} className="btn bg-discord-success hover:bg-discord-success/80 text-black w-full py-3 font-bold flex justify-center mt-2">
                {addingMenu ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ajouter au planning'}
              </button>
            </form>
          </div>
        </div>

        {/* Colonne Liste des menus */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                Menus Prévus
              </h3>
              <button
                onClick={deployMenu}
                disabled={deploying || menus.length === 0}
                className="btn bg-[#5865F2] hover:bg-[#5865F2]/80 text-white px-6 py-2 font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(88,101,242,0.3)] disabled:opacity-50 disabled:shadow-none"
              >
                {deploying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Déployer (2 prochains jours)
              </button>
            </div>

            {menus.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <Utensils className="w-12 h-12 mb-4" />
                <p>Aucun menu prévu pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {menus.map((m: any) => {
                  const date = new Date(m.menu_date)
                  const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date)
                  return (
                    <div key={m.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start justify-between group hover:border-white/20 transition-colors">
                      <div>
                        <h4 className="font-bold text-amber-400 capitalize text-lg mb-2">
                          {dayName} {date.toLocaleDateString('fr-FR')}
                        </h4>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-300">
                          {m.starter && <div><span className="text-gray-500 uppercase text-[10px] tracking-widest block">Entrée</span>{m.starter}</div>}
                          {m.main && <div><span className="text-gray-500 uppercase text-[10px] tracking-widest block">Plat</span>{m.main}</div>}
                          {m.side && <div><span className="text-gray-500 uppercase text-[10px] tracking-widest block">Fromage</span>{m.side}</div>}
                          {m.dessert && <div><span className="text-gray-500 uppercase text-[10px] tracking-widest block">Dessert</span>{m.dessert}</div>}
                        </div>
                      </div>
                      <button onClick={() => deleteMenu(m.id)} className="p-2 text-discord-error/50 hover:text-discord-error hover:bg-discord-error/10 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
