'use client'

import { useAuth } from '@/context/AuthContext'
import { Utensils, QrCode, CalendarClock, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
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
    <div className="page-container w-full mx-auto">
      <div className="animate-slideIn mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white flex items-center gap-4 tracking-tighter">
              <Utensils className="text-orange-500 w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
              Cantine LunaVerse
            </h1>
            <p className="text-discord-muted mt-2 text-lg font-medium">Gérez vos repas et vos abonnements au réfectoire.</p>
          </div>
          {hasSubscription && (
            <div className="bg-discord-success/10 text-discord-success px-4 py-2 rounded-2xl border border-discord-success/20 flex items-center gap-2 font-black text-xs uppercase tracking-widest h-fit">
              <CheckCircle2 className="w-4 h-4" /> Abonnement Actif
            </div>
          )}
        </div>
        
        {errorMsg && (
          <div className="mt-6 bg-discord-error/10 border border-discord-error/20 text-discord-error px-4 py-4 rounded-2xl flex items-center gap-3 font-bold animate-shake">
            <AlertCircle className="w-5 h-5" /> {errorMsg}
          </div>
        )}

        {/* Dynamic Daily Menu */}
        {activeMenu && (
          <div className="mt-10 glass-card p-6 sm:p-12 relative overflow-hidden group border-orange-500/30 shadow-[0_0_80px_rgba(249,115,22,0.1)] rounded-[2.5rem] animate-fadeIn">
            <div className="absolute top-0 right-0 p-8 text-8xl opacity-5 group-hover:scale-110 transition-transform select-none pointer-events-none">🍱</div>
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/10 blur-[100px] rounded-full" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black bg-orange-500 text-white px-3 py-1 rounded-full uppercase tracking-[0.2em] animate-pulse">Service en cours</span>
                  <span className="text-[10px] font-black bg-white/10 text-white/60 px-3 py-1 rounded-full uppercase tracking-[0.2em]">Aujourd&apos;hui</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter">
                  Menu du Jour
                </h2>
              </div>
              <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/5 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest">Horaires du service</p>
                  <p className="text-xl font-bold text-white tracking-tight">{activeMenu.time_start.slice(0, 5)} — {activeMenu.time_end.slice(0, 5)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
               {activeMenu.starter && (
                 <div className="space-y-3 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.04] group/item">
                    <p className="text-[10px] font-black text-discord-muted uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-discord-muted" /> Entrée
                    </p>
                    <p className="text-2xl font-bold text-white leading-snug group-hover/item:text-orange-400 transition-colors">{activeMenu.starter}</p>
                 </div>
               )}
               <div className="space-y-4 p-8 sm:p-10 rounded-[3rem] bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30 sm:col-span-2 lg:col-span-1 shadow-2xl shadow-orange-500/5 group/item">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" /> Plat Principal
                  </p>
                  <p className="text-4xl sm:text-5xl font-black text-white leading-tight group-hover/item:scale-[1.02] transition-transform origin-left">{activeMenu.main}</p>
               </div>
               {activeMenu.side && (
                 <div className="space-y-3 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.04] group/item">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Accompagnement
                    </p>
                    <p className="text-2xl font-bold text-white leading-snug group-hover/item:text-orange-400 transition-colors">{activeMenu.side}</p>
                 </div>
               )}
               {activeMenu.dessert && (
                 <div className="space-y-3 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.04] group/item">
                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Dessert
                    </p>
                    <p className="text-2xl font-bold text-white leading-snug group-hover/item:text-pink-400 transition-colors">{activeMenu.dessert}</p>
                 </div>
               )}
               {activeMenu.drink && (
                 <div className="space-y-3 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.04] group/item">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Boisson
                    </p>
                    <p className="text-2xl font-bold text-white leading-snug group-hover/item:text-blue-400 transition-colors">{activeMenu.drink}</p>
                 </div>
               )}
            </div>

            {activeMenu.note && (
               <div className="mt-10 flex items-start gap-5 text-discord-muted bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 italic relative z-10">
                  <span className="text-3xl leading-none">💡</span> 
                  <p className="text-lg leading-relaxed font-medium">{activeMenu.note}</p>
               </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
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
        </div>
      </div>

      {upcomingMenus.length > 0 && (
        <div className="mt-16 space-y-12 animate-fadeIn pb-24">
          <div className="flex items-center gap-4 px-2">
            <div className="h-10 w-1.5 bg-orange-500 rounded-full" />
            <h3 className="text-3xl font-black text-white flex items-center gap-3">
              <CalendarClock className="w-8 h-8 text-orange-500" /> Prochains Menus
            </h3>
          </div>
          <div className="space-y-10">
            {upcomingMenus.map((m: any) => (
              <div key={m.id} className="glass-card flex flex-col lg:flex-row bg-white/[0.03] border-white/10 hover:border-orange-500/50 transition-all relative group overflow-hidden p-0 rounded-[2rem] min-h-[220px] shadow-2xl">
                <div className="absolute top-0 left-0 w-3 h-full bg-orange-500/30 group-hover:bg-orange-500 transition-colors" />
                
                {/* Date Side - Large and prominent */}
                <div className="flex-shrink-0 flex flex-row lg:flex-col items-center justify-center gap-6 lg:gap-2 bg-white/5 p-8 lg:w-64 border-b lg:border-b-0 lg:border-r border-white/10">
                   <div className="text-center">
                     <p className="text-sm font-black text-orange-500 uppercase tracking-[0.3em] mb-2">
                        {new Date(m.menu_date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                     </p>
                     <p className="text-7xl font-black text-white leading-none tracking-tighter">
                        {new Date(m.menu_date).getDate()}
                     </p>
                     <p className="text-lg font-bold text-discord-muted uppercase tracking-[0.2em] mt-2">
                        {new Date(m.menu_date).toLocaleDateString('fr-FR', { month: 'long' })}
                     </p>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-black/50 rounded-2xl lg:mt-6 border border-white/5">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-black text-white whitespace-nowrap">
                        {m.time_start.slice(0, 5)} - {m.time_end.slice(0, 5)}
                      </span>
                   </div>
                </div>

                {/* Content Side - Massive Text */}
                <div className="flex-1 p-10 flex flex-col justify-center bg-gradient-to-br from-transparent to-orange-500/5">
                   <div className="flex flex-col space-y-12">
                      {m.starter && (
                        <div className="space-y-2">
                           <p className="text-xs font-black text-discord-muted uppercase tracking-[0.2em]">🥗 Entrée</p>
                           <p className="text-xl font-bold text-white/90 whitespace-pre-wrap leading-relaxed">{m.starter}</p>
                        </div>
                      )}
                      <div className="space-y-4 md:col-span-1">
                         <p className="text-sm font-black text-orange-500 uppercase tracking-[0.2em]">🥩 Plat Principal</p>
                         <p className="text-4xl font-black text-white whitespace-pre-wrap leading-tight">{m.main}</p>
                      </div>
                      {m.side && (
                        <div className="space-y-2">
                           <p className="text-xs font-black text-orange-300 uppercase tracking-[0.2em]">🍚 Accompagnement</p>
                           <p className="text-xl font-bold text-white/90 whitespace-pre-wrap leading-relaxed">{m.side}</p>
                        </div>
                      )}
                      {m.dessert && (
                        <div className="space-y-2">
                           <p className="text-xs font-black text-pink-400 uppercase tracking-[0.2em]">🍰 Dessert</p>
                           <p className="text-xl font-bold text-white/90 whitespace-pre-wrap leading-relaxed">{m.dessert}</p>
                        </div>
                      )}
                      {m.drink && (
                        <div className="space-y-2">
                           <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">🥤 Boisson</p>
                           <p className="text-xl font-bold text-white/90 whitespace-pre-wrap leading-relaxed">{m.drink}</p>
                        </div>
                      )}
                   </div>
                   
                   {m.note && (
                      <div className="mt-10 pt-6 border-t border-white/10 flex items-center gap-4 text-sm text-discord-muted italic bg-white/5 p-4 rounded-2xl">
                         <span className="text-2xl">💡</span> {m.note}
                      </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
