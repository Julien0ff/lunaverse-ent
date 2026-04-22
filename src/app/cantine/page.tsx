'use client'

import { useAuth } from '@/context/AuthContext'
import { Utensils, QrCode, CalendarClock, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'

export default function Cantine() {
  const { profile, roles, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<any>(null)
  const [upcomingMenus, setUpcomingMenus] = useState<any[]>([])
  
  const fetchMenu = async () => {
    try {
      const r = await fetch('/api/cantine/menu')
      if (r.ok) {
        const data = await r.json()
        setActiveMenu(data.active)
        setUpcomingMenus(data.menus.filter((m: any) => m.id !== data.active?.id))
      }
    } catch(e) {}
  }

  useEffect(() => {
    fetchMenu()
    const int = setInterval(fetchMenu, 30000)
    return () => clearInterval(int)
  }, [])
  
  const hasSubscription = profile?.canteen_subscription === 'weekly' || profile?.canteen_subscription === 'monthly'

  const mainRoleName = roles?.find(r => r.name.toLowerCase() !== 'admin')?.name || 'Étudiant'

  const handleSubscribe = async (type: 'weekly' | 'monthly') => {
    if (!profile?.id || purchasing) return
    setPurchasing(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/cantine/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      const data = await response.json()
      if (response.ok) {
        await refreshProfile()
      } else {
        setErrorMsg(data.error || 'Erreur lors de la souscription')
        setTimeout(() => setErrorMsg(null), 4000)
      }
    } catch (e) {
      setErrorMsg('Erreur de connexion')
      setTimeout(() => setErrorMsg(null), 4000)
    } finally {
      setPurchasing(false)
    }
  }

  const handleUnsubscribe = async () => {
    if (!profile?.id || purchasing) return
    setPurchasing(true)
    setErrorMsg(null)

    try {
      const response = await fetch('/api/cantine/unsubscribe', {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        await refreshProfile()
      } else {
        setErrorMsg(data.error || 'Erreur lors de la résiliation')
        setTimeout(() => setErrorMsg(null), 4000)
      }
    } catch (e) {
      setErrorMsg('Erreur de connexion')
      setTimeout(() => setErrorMsg(null), 4000)
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="animate-slideIn mb-8">
        <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
          <Utensils className="text-orange-500 w-10 h-10" />
          Cantine LunaVerse
        </h1>
        <p className="text-discord-muted mt-2">Gérez vos repas et vos abonnements au réfectoire.</p>
        
        {errorMsg && (
          <div className="mt-4 bg-discord-error/10 border border-discord-error/20 text-discord-error px-4 py-3 rounded-xl flex items-center gap-2 font-bold animate-fadeIn">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {/* Dynamic Daily Menu */}
        {activeMenu && (
          <div className="mt-6 glass-card bg-gradient-to-r from-orange-500/10 to-discord-blurple/10 border-orange-500/30 p-6 animate-fadeIn relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3">
               <span className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest">
                  Actuel
               </span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                  <Utensils className="text-orange-500 w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Menu du Moment</h3>
                  <p className="text-discord-muted text-xs font-medium uppercase tracking-widest">Service de {activeMenu.time_start.slice(0, 5)} à {activeMenu.time_end.slice(0, 5)}</p>
               </div>
            </div>

            <div className="flex flex-wrap gap-4">
               {activeMenu.starter && (
                 <div className="flex-1 min-w-[120px] p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-orange-500/20 transition-colors">
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Entrée</p>
                    <p className="text-sm font-bold text-white canteen-menu-item">{activeMenu.starter}</p>
                 </div>
               )}
               <div className="flex-[2] min-w-[200px] p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Plat Principal</p>
                  <p className="text-base font-black text-white canteen-menu-main">{activeMenu.main}</p>
               </div>
               {activeMenu.side && (
                 <div className="flex-1 min-w-[120px] p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-orange-500/20 transition-colors">
                    <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest mb-1">Accompagnement</p>
                    <p className="text-sm font-bold text-white canteen-menu-item">{activeMenu.side}</p>
                 </div>
               )}
               {activeMenu.dessert && (
                 <div className="flex-1 min-w-[120px] p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-orange-500/20 transition-colors">
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">Dessert</p>
                    <p className="text-sm font-bold text-white canteen-menu-item">{activeMenu.dessert}</p>
                 </div>
               )}
               {activeMenu.drink && (
                 <div className="flex-1 min-w-[120px] p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-blue-500/20 transition-colors">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Boisson</p>
                    <p className="text-sm font-bold text-white canteen-menu-item">{activeMenu.drink}</p>
                 </div>
               )}
            </div>

            {activeMenu.note && (
               <div className="mt-4 flex items-center gap-2 text-xs text-discord-muted bg-black/20 p-3 rounded-xl border border-white/5 italic">
                  <span className="text-base">💡</span> {activeMenu.note}
               </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pass Carte */}
        <div className="glass-card flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
          
          <div className="w-32 h-32 bg-white rounded-2xl p-2 mb-6 shadow-xl relative z-10 group-hover:scale-105 transition-transform">
            <QrCode className="w-full h-full text-black" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2">Carte {mainRoleName}</h2>
          <p className="text-discord-muted font-mono tracking-[0.2em]">{profile?.discord_id || '0000000000'}</p>
          
          <div className="mt-6 w-full flex flex-col gap-2">
            {!hasSubscription ? (
              <div className="bg-discord-error/10 text-discord-error p-3 rounded-xl font-bold border border-discord-error/20 flex items-center justify-center gap-2">
                Aucun abonnement actif
              </div>
            ) : (
               <>
                 <div className="bg-discord-success/10 text-discord-success p-3 rounded-xl font-bold border border-discord-success/20 flex items-center justify-center gap-2 text-lg">
                   <CheckCircle2 className="w-5 h-5" /> PASS REPAS ACTIF
                 </div>
                 <button 
                    onClick={handleUnsubscribe}
                    disabled={purchasing}
                    className="mt-2 text-sm text-discord-muted hover:text-discord-error transition-colors underline decoration-discord-error/50 underline-offset-4"
                  >
                    Résilier l&apos;abonnement
                 </button>
               </>
            )}
          </div>
        </div>

        {/* Abonnements */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-500" /> Options d&apos;Abonnement
          </h3>
          
          <div className={clsx(
            "p-6 rounded-2xl border transition-all relative overflow-hidden group",
            profile?.canteen_subscription === 'weekly'
              ? "bg-orange-500/20 border-orange-500"
              : "bg-white/5 border-white/10 hover:border-orange-500/50"
          )}>
            {profile?.canteen_subscription === 'weekly' && (
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full">
                Actuel
              </div>
            )}
            <h4 className="text-xl font-black text-white mb-1">Pass Hebdomadaire</h4>
            <p className="text-discord-muted text-sm mb-4">Accès illimité à la cantine pendant 7 jours.</p>
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black text-orange-400">45€</span>
              {!hasSubscription ? (
                <button
                  onClick={() => handleSubscribe('weekly')}
                  disabled={purchasing}
                  className="btn btn-primary text-sm py-2 px-4 bg-orange-500 hover:bg-orange-400 shadow-lg shadow-orange-500/30"
                >
                  {purchasing ? 'Chargement...' : 'Souscrire →'}
                </button>
              ) : profile?.canteen_subscription !== 'weekly' ? (
                <button
                  onClick={() => handleSubscribe('weekly')}
                  disabled={purchasing}
                  className="text-xs font-bold uppercase tracking-widest text-white px-4 py-2 rounded-lg transition-colors bg-white/10 hover:bg-orange-500"
                >
                  Changer
                </button>
              ) : null}
            </div>
          </div>

          <div className={clsx(
            "p-6 rounded-2xl border transition-all relative overflow-hidden group",
            profile?.canteen_subscription === 'monthly'
              ? "bg-orange-500/20 border-orange-500"
              : "bg-white/5 border-white/10 hover:border-orange-500/50"
          )}>
            {profile?.canteen_subscription === 'monthly' && (
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full">
                Actuel
              </div>
            )}
            <h4 className="text-xl font-black text-white mb-1">Pass Mensuel</h4>
            <p className="text-discord-muted text-sm mb-4">30 jours de tranquillité. Prélèvement direct.</p>
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black text-orange-400">140€</span>
              {!hasSubscription ? (
                <button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={purchasing}
                  className="btn btn-primary text-sm py-2 px-4 bg-orange-500 hover:bg-orange-400 shadow-lg shadow-orange-500/30"
                >
                  {purchasing ? 'Chargement...' : 'Souscrire →'}
                </button>
              ) : profile?.canteen_subscription !== 'monthly' ? (
                <button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={purchasing}
                  className="text-xs font-bold uppercase tracking-widest text-white px-4 py-2 rounded-lg transition-colors bg-white/10 hover:bg-orange-500"
                >
                  Changer
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-discord-blurple/10 border border-discord-blurple/20">
            <p className="text-sm font-medium text-discord-blurple flex items-start gap-2">
              <span className="text-lg leading-none">💡</span>
              Une fois souscrit, passez au self avec cette page pour que l&apos;agent scanne votre QR Code.
            </p>
          </div>

          {upcomingMenus.length > 0 && (
            <div className="mt-12 space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-1 bg-orange-500 rounded-full" />
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  <CalendarClock className="w-7 h-7 text-orange-500" /> Prochains Menus
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {upcomingMenus.map((m: any) => (
                  <div key={m.id} className="p-8 glass-card bg-white/[0.02] border-white/5 hover:border-orange-500/30 transition-all flex flex-col md:flex-row gap-8 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-orange-500/20 group-hover:bg-orange-500/50 transition-colors" />
                    
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white/5 rounded-3xl p-6 min-w-[140px] border border-white/5">
                       <span className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] mb-1">
                          {new Date(m.menu_date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                       </span>
                       <span className="text-4xl font-black text-white">
                          {new Date(m.menu_date).getDate()}
                       </span>
                       <span className="text-sm font-bold text-discord-muted uppercase">
                          {new Date(m.menu_date).toLocaleDateString('fr-FR', { month: 'short' })}
                       </span>
                       <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full">
                          <Clock className="w-3 h-3 text-discord-muted" />
                          <span className="text-[10px] font-bold text-white">
                            {m.time_start.slice(0, 5)} - {m.time_end.slice(0, 5)}
                          </span>
                       </div>
                    </div>

                    <div className="flex-1 space-y-4">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {m.starter && (
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest">Entrée</p>
                               <p className="text-lg font-bold text-white/90">{m.starter}</p>
                            </div>
                          )}
                          <div className="space-y-1 sm:col-span-2">
                             <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Plat Principal</p>
                             <p className="text-2xl font-black text-white">{m.main}</p>
                          </div>
                          {m.side && (
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-orange-300 uppercase tracking-widest">Accompagnement</p>
                               <p className="text-lg font-bold text-white/90">{m.side}</p>
                            </div>
                          )}
                          {m.dessert && (
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Dessert</p>
                               <p className="text-lg font-bold text-white/90">{m.dessert}</p>
                            </div>
                          )}
                       </div>
                       
                       {m.note && (
                          <div className="pt-4 border-t border-white/5 flex items-center gap-3 text-sm text-discord-muted italic">
                             <span className="text-lg">💡</span> {m.note}
                          </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
