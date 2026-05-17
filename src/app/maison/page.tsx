'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Home, Plus, Users, ShieldAlert, CheckCircle2, Clock, Trash2, UserPlus, Settings2, Info, ShoppingCart, Loader2, Search } from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

const DLC_ITEMS = [
  { id: 'frigo', icon: '❄️', price: 500, command: '/frigo' },
  { id: 'bed', icon: '🛏️', price: 750, command: '/dormir' },
  { id: 'tv', icon: '📺', price: 300, command: null },
  { id: 'safe', icon: '🔒', price: 1000, command: null },
]

export default function MaisonPage() {
  const { profile, refreshProfile } = useAuth()
  const { t } = useLanguage()
  const [house, setHouse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requestName, setRequestName] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'settings'>('info')
  const [newWhitelistId, setNewWhitelistId] = useState('')
  const [newBlacklistId, setNewBlacklistId] = useState('')
  const [buyingItem, setBuyingItem] = useState<string | null>(null)

  // User search for whitelist/blacklist
  const [whitelistSearch, setWhitelistSearch] = useState('')
  const [blacklistSearch, setBlacklistSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchingFor, setSearchingFor] = useState<'whitelist' | 'blacklist' | null>(null)

  // Resolved profiles for list entries
  const [resolvedProfiles, setResolvedProfiles] = useState<Record<string, any>>({})

  useEffect(() => {
    loadHouse()
  }, [])

  const loadHouse = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/houses')
      const data = await res.json()
      if (data.house) {
        setHouse(data.house)
        // Resolve profiles for whitelist/blacklist
        resolveListProfiles(data.house)
      }
    } catch (e) {}
    setLoading(false)
  }

  const resolveListProfiles = async (h: any) => {
    const allIds = [...(h.whitelist || []), ...(h.blacklist || [])]
    if (allIds.length === 0) return
    try {
      const res = await fetch('/api/profiles/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: allIds })
      })
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, any> = {}
        for (const p of (data.profiles || [])) {
          map[p.id] = p
        }
        setResolvedProfiles(map)
      }
    } catch {}
  }

  const searchUsers = useCallback(async (query: string, target: 'whitelist' | 'blacklist') => {
    if (query.length < 2) { setSearchResults([]); return }
    setSearchingFor(target)
    try {
      const res = await fetch(`/api/bank/search-users?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.users || [])
      }
    } catch {}
  }, [])

  // Debounced search
  useEffect(() => {
    if (whitelistSearch.length >= 2) {
      const timer = setTimeout(() => searchUsers(whitelistSearch, 'whitelist'), 300)
      return () => clearTimeout(timer)
    } else { if (searchingFor === 'whitelist') setSearchResults([]) }
  }, [whitelistSearch, searchUsers, searchingFor])

  useEffect(() => {
    if (blacklistSearch.length >= 2) {
      const timer = setTimeout(() => searchUsers(blacklistSearch, 'blacklist'), 300)
      return () => clearTimeout(timer)
    } else { if (searchingFor === 'blacklist') setSearchResults([]) }
  }, [blacklistSearch, searchUsers, searchingFor])

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
        setMsg({ type: 'success', text: t('maison_page.request_sent') })
        loadHouse()
      } else {
        setMsg({ type: 'error', text: data.error || 'Erreur' })
      }
    } catch (e) {}
    setSubmitting(false)
  }

  const updateList = async (type: 'whitelist' | 'blacklist', action: 'add' | 'remove', userId: string) => {
    if (!house) return
    const currentList = house[type] || []
    let newList = [...currentList]
    
    if (action === 'add') {
      if (!userId || newList.includes(userId)) return
      newList.push(userId)
    } else {
      newList = newList.filter((id: string) => id !== userId)
    }

    try {
      const res = await fetch('/api/houses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: newList })
      })
      if (res.ok) {
        const updated = { ...house, [type]: newList }
        setHouse(updated)
        setMsg({ type: 'success', text: t('maison_page.list_updated') || 'Liste mise à jour !' })
        if (type === 'whitelist') { setWhitelistSearch(''); setNewWhitelistId('') }
        if (type === 'blacklist') { setBlacklistSearch(''); setNewBlacklistId('') }
        setSearchResults([])
        setSearchingFor(null)
        resolveListProfiles(updated)
      } else {
        const data = await res.json()
        setMsg({ type: 'error', text: data.error || 'Erreur de mise à jour' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Erreur réseau' })
    }
  }

  const buyFurnishing = async (itemId: string) => {
    setBuyingItem(itemId)
    setMsg(null)
    try {
      const res = await fetch('/api/houses/furnishings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId })
      })
      const data = await res.json()
      if (res.ok) {
        setHouse({ ...house, furnishings: data.furnishings })
        setMsg({ type: 'success', text: `${t('maison_page.purchased')} 🎉` || 'Acheté avec succès ! 🎉' })
        refreshProfile()
      } else {
        setMsg({ type: 'error', text: data.error || 'Erreur d\'achat' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Erreur réseau' })
    }
    setBuyingItem(null)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-discord-blurple border-t-transparent rounded-full animate-spin" /></div>

  const renderUserSearchInput = (type: 'whitelist' | 'blacklist') => {
    const searchValue = type === 'whitelist' ? whitelistSearch : blacklistSearch
    const setSearchValue = type === 'whitelist' ? setWhitelistSearch : setBlacklistSearch
    const isActive = searchingFor === type

    return (
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 flex bg-white/5 rounded-xl border border-white/10 p-1 items-center">
            <Search className="w-4 h-4 text-discord-muted ml-2 mr-1 flex-shrink-0" />
            <input
              type="text"
              placeholder={t('maison_page.search_placeholder') || 'Rechercher un joueur...'}
              className="flex-1 bg-transparent border-none text-white text-xs px-2 py-1.5 focus:outline-none min-w-0"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onFocus={() => setSearchingFor(type)}
            />
          </div>
        </div>
        {isActive && searchResults.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-discord-dark/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto flex flex-col custom-scrollbar">
            {searchResults.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  updateList(type, 'add', u.id)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
              >
                <Image src={u.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'} width={24} height={24} alt="" className="rounded-full flex-shrink-0" />
                <span className="font-bold text-white truncate">{u.nickname_rp || u.username}</span>
                <span className="text-xs text-discord-muted ml-auto font-mono">{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderListEntry = (id: string, type: 'whitelist' | 'blacklist') => {
    const resolved = resolvedProfiles[id]
    return (
      <div key={id} className={clsx(
        "flex items-center justify-between p-3 rounded-xl border transition-all",
        type === 'whitelist' ? "bg-white/5 border-white/5" : "bg-discord-error/5 border-discord-error/10"
      )}>
        <div className="flex items-center gap-3 min-w-0">
          {resolved?.avatar_url ? (
            <Image src={resolved.avatar_url} width={28} height={28} alt="" className="rounded-full flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-discord-muted" />
            </div>
          )}
          <div className="min-w-0">
            <p className={clsx("text-sm font-bold truncate", type === 'whitelist' ? "text-white" : "text-discord-error")}>
              {resolved?.nickname_rp || resolved?.username || id.slice(0, 8) + '...'}
            </p>
            {resolved?.username && <p className="text-[10px] text-discord-muted truncate">{resolved.username}</p>}
          </div>
        </div>
        <button
          onClick={() => updateList(type, 'remove', id)}
          className={clsx(
            "p-2 rounded-lg transition-colors flex-shrink-0",
            type === 'whitelist' ? "text-discord-error hover:bg-discord-error/10" : "text-discord-muted hover:text-white hover:bg-white/10"
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="page-container max-w-6xl mx-auto">
      <div className="animate-slideIn mb-8">
        <h1 className="text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
          <Home className="text-discord-blurple w-10 h-10" />
          {t('maison_page.title')}
        </h1>
        <p className="text-discord-muted mt-2">{t('maison_page.subtitle')}</p>
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
          <h2 className="text-3xl font-black text-white mb-4">{t('maison_page.become_owner') || 'Devenez Propriétaire'}</h2>
          <p className="text-discord-muted max-w-md mx-auto mb-10">{t('maison_page.become_desc') || 'Faites une demande pour obtenir votre propre maison privée sur LunaVerse. Une fois validée, un salon Discord vous sera dédié.'}</p>
          
          <form onSubmit={handleRequest} className="max-w-md mx-auto">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-2 block text-left">{t('maison_page.house_name') || 'Nom de votre Maison'}</label>
                <input 
                  type="text" 
                  className="glass-input text-center text-xl font-bold" 
                  placeholder={t('maison_page.house_placeholder') || 'Ex: Villa de Julien...'}
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
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (t('maison_page.submit_request') || 'Soumettre ma demande')}
              </button>
            </div>
          </form>
        </div>
      ) : house.status === 'pending' ? (
        <div className="glass-card p-12 text-center border-discord-warning/20 animate-scaleIn">
          <div className="w-24 h-24 bg-discord-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-discord-warning animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">{t('maison_page.pending') || 'Demande en Cours'}</h2>
          <p className="text-discord-muted mb-2">
            {t('maison_page.pending_desc')?.replace('{name}', house.name) || `Votre demande pour la maison "${house.name}" est en cours d'examen.`}
          </p>
          <p className="text-sm text-discord-muted opacity-60">{t('maison_page.pending_admin') || "L'administration validera votre demande prochainement."}</p>
        </div>
      ) : house.status === 'rejected' ? (
        <div className="glass-card p-12 text-center border-discord-error/20 animate-scaleIn">
          <div className="w-24 h-24 bg-discord-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-12 h-12 text-discord-error" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">{t('maison_page.rejected') || 'Demande Refusée'}</h2>
          <p className="text-discord-muted mb-6">
            {t('maison_page.rejected_desc')?.replace('{name}', house.name) || `Votre demande pour la maison "${house.name}" a été refusée.`}
          </p>
          <button 
            onClick={() => setHouse(null)}
            className="btn btn-primary px-8 py-3"
          >
            {t('maison_page.retry') || 'Refaire une demande'}
          </button>
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
                {t('maison_page.tab_info')}
              </button>
              <button 
                onClick={() => setActiveTab('members')}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                  activeTab === 'members' ? "bg-discord-blurple text-white" : "text-discord-muted hover:bg-white/5"
                )}
              >
                <Users className="w-5 h-5" />
                {t('maison_page.tab_members')}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                  activeTab === 'settings' ? "bg-discord-blurple text-white" : "text-discord-muted hover:bg-white/5"
                )}
              >
                <Settings2 className="w-5 h-5" />
                {t('maison_page.tab_settings')}
              </button>
            </div>

            <div className="glass-card p-6 bg-gradient-to-br from-discord-blurple/10 to-transparent">
              <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-4">{t('maison_page.property_status') || 'Statut Propriété'}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-discord-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-discord-success" />
                </div>
                <div>
                  <p className="text-white font-black">{t('maison_page.approved')}</p>
                  <p className="text-[10px] text-discord-muted">ID: {house.discord_channel_id || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Balance reminder */}
            <div className="glass-card p-4 bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/10">
              <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">{t('maison_page.your_balance') || 'Votre Solde'}</p>
              <p className="text-2xl font-black text-white">{Number(profile?.balance || 0).toFixed(2)}€</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'info' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-card p-8 bg-black/40 overflow-hidden relative">
                   <div className="absolute -top-12 -right-12 w-48 h-48 bg-discord-blurple/10 rounded-full blur-3xl" />
                   <h2 className="text-4xl font-black text-white mb-2">{house.name}</h2>
                   <p className="text-discord-muted font-medium mb-8">{t('maison_page.your_sanctuary') || 'Votre sanctuaire privé sur LunaVerse.'}</p>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">{t('maison_page.category') || 'Catégorie'}</p>
                        <p className="text-xl font-bold text-white">{t('maison_page.residential') || 'Résidentiel'}</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">{t('maison_page.furnishings_count') || 'Meubles installés'}</p>
                        <p className="text-xl font-bold text-white">{Object.values(house.furnishings || {}).filter(Boolean).length} / {DLC_ITEMS.length}</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">{t('maison_page.access_count') || 'Accès autorisés'}</p>
                        <p className="text-xl font-bold text-white">{(house.whitelist || []).length} {t('maison_page.members_label') || 'membre(s)'}</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-card p-8">
                  <div className="flex flex-col gap-4 mb-6">
                    <h3 className="text-xl font-black text-white">{t('maison_page.whitelist')}</h3>
                    {renderUserSearchInput('whitelist')}
                  </div>
                  
                  {(!house.whitelist || house.whitelist.length === 0) ? (
                    <div className="text-center py-10 text-discord-muted border border-dashed border-white/10 rounded-2xl">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">{t('maison_page.empty_whitelist') || "Personne n'est dans votre whitelist pour le moment."}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {house.whitelist.map((id: string) => renderListEntry(id, 'whitelist'))}
                    </div>
                  )}
                </div>

                <div className="glass-card p-8 border-discord-error/20">
                   <div className="flex flex-col gap-4 mb-6">
                     <h3 className="text-xl font-black text-discord-error">{t('maison_page.blacklist')}</h3>
                     {renderUserSearchInput('blacklist')}
                   </div>
                   {(!house.blacklist || house.blacklist.length === 0) ? (
                     <div className="text-center py-6 text-discord-muted italic text-xs">
                       {t('maison_page.empty_blacklist') || 'La liste est vide.'}
                     </div>
                   ) : (
                    <div className="space-y-2">
                      {house.blacklist.map((id: string) => renderListEntry(id, 'blacklist'))}
                    </div>
                   )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-card p-6 mb-2 bg-gradient-to-r from-discord-blurple/10 to-transparent">
                  <h3 className="text-xl font-black text-white mb-1">{t('maison_page.dlc_title') || 'Aménagements (DLCs)'}</h3>
                  <p className="text-sm text-discord-muted">{t('maison_page.dlc_desc') || 'Achetez des meubles pour débloquer des commandes RP dans votre salon Discord.'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DLC_ITEMS.map(item => {
                    const isOwned = house?.furnishings?.[item.id] === true
                    const isBuying = buyingItem === item.id
                    return (
                    <div key={item.id} className={clsx(
                      "glass-card p-6 flex flex-col gap-4 transition-all group relative overflow-hidden",
                      isOwned ? "border-discord-success/40 bg-discord-success/5" : "hover:border-discord-blurple/30"
                    )}>
                      {isOwned && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="w-5 h-5 text-discord-success" />
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{item.icon}</div>
                        <div className="flex-1">
                          <h4 className="text-lg font-black text-white mb-1">{t(`maison_page.dlc_${item.id}_name`) || item.id}</h4>
                          <p className="text-xs text-discord-muted">{t(`maison_page.dlc_${item.id}_desc`) || ''}</p>
                          {item.command && (
                            <p className="text-[10px] text-discord-blurple mt-1 font-mono">{t('maison_page.unlocks') || 'Débloque'}: {item.command}</p>
                          )}
                        </div>
                      </div>
                      {isOwned ? (
                        <div className="text-xs font-black text-discord-success uppercase tracking-widest text-center py-2 bg-discord-success/10 rounded-xl">
                          ✅ {t('maison_page.installed') || 'Installé'}
                        </div>
                      ) : (
                        <button
                          onClick={() => buyFurnishing(item.id)}
                          disabled={isBuying}
                          className="btn bg-discord-blurple hover:bg-discord-blurple-dark text-white w-full py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-discord-blurple/20 disabled:opacity-50"
                        >
                          {isBuying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              {t('maison_page.buy_for') || 'Acheter pour'} {item.price}€
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )})}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
