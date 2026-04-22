'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Moon, Sun, Languages, Bell, Shield, User, Rocket, Zap, Settings, Check, ExternalLink, Palette } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import clsx from 'clsx'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'language' | 'notifications' | 'admin'>('profile')
  const [mounted, setMounted] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('dark')
  const [webEnabled, setWebEnabled] = useState(true)
  const [dmsEnabled, setDmsEnabled] = useState(true)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [dynamicStatsEnabled, setDynamicStatsEnabled] = useState(true)
  const [savingAdmin, setSavingAdmin] = useState(false)
  
  const { profile, supabase, refreshProfile } = useAuth()
  const { locale, setLocale, t } = useLanguage()

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [isOpen])

  const checkAdminStatus = useCallback(async () => {
    if (!profile) return
    const { data: adminData } = await supabase.from('admins').select('id').eq('profile_id', profile.id).maybeSingle()
    setIsAdminUser(!!adminData)
  }, [profile, supabase])

  const fetchAdminSettings = useCallback(async () => {
    const { data } = await supabase.from('server_settings').select('value').eq('key', 'global_dynamic_stats').maybeSingle()
    if (data) setDynamicStatsEnabled(data.value === true)
  }, [supabase])

  useEffect(() => {
    const savedTheme = localStorage.getItem('lunaverse-theme') || 'dark'
    setSelectedTheme(savedTheme)
    
    const savedWeb = localStorage.getItem('lunaverse-web-notifications')
    setWebEnabled(savedWeb !== 'false')

    if (profile) {
      setDmsEnabled(profile.notifications_enabled !== false)
      
      // Check if admin
      checkAdminStatus()
      fetchAdminSettings()
    }
  }, [profile, checkAdminStatus, fetchAdminSettings])

  const toggleDynamicStats = async () => {
    setSavingAdmin(true)
    const newState = !dynamicStatsEnabled
    setDynamicStatsEnabled(newState)
    await supabase.from('server_settings').upsert({ key: 'global_dynamic_stats', value: newState, updated_at: new Date().toISOString() })
    setSavingAdmin(false)
  }

  const toggleDms = async () => {
    const newState = !dmsEnabled
    setDmsEnabled(newState)
    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: newState })
        .eq('id', profile.id)
      
      if (!error) refreshProfile()
    }
  }

  const toggleWeb = () => {
    const newState = !webEnabled
    setWebEnabled(newState)
    localStorage.setItem('lunaverse-web-notifications', String(newState))
  }

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId)
    localStorage.setItem('lunaverse-theme', themeId)
    const root = document.documentElement
    root.classList.remove('theme-light')
    if (themeId === 'light') {
      root.classList.add('theme-light')
    }
  }

  if (!isOpen || !mounted) return null

  const TABS = [
    { id: 'profile', label: t('settings.general'), icon: User },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'language', label: t('settings.language'), icon: Languages },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
  ]
  if (isAdminUser) TABS.push({ id: 'admin', label: 'Admin', icon: Settings })

  const THEMES = [
    { id: 'dark', name: t('settings.theme.dark'), icon: Moon, desc: 'Classique & Reposant' },
    { id: 'light', name: t('settings.theme.light'), icon: Sun, desc: 'Solaire & Épuré' },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fadeIn" onClick={onClose} />

      <div className="relative w-full h-full md:h-[700px] md:max-w-5xl bg-[var(--discord-darkest)] border-none md:border md:border-white/10 rounded-none md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-discord-blurple rounded-2xl flex items-center justify-center shadow-lg shadow-discord-blurple/20">
              <Settings className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{t('settings.title')}</h2>
              <p className="text-[10px] text-discord-muted uppercase tracking-[0.2em] font-bold">Configuration LunaVerse</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-discord-error/20 text-discord-muted hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Navigation */}
          <div className="w-full md:w-64 bg-white/[0.03] border-r border-white/5 p-4 md:p-6 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar flex-shrink-0">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    'flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative group',
                    activeTab === tab.id 
                      ? 'bg-discord-blurple text-white shadow-lg shadow-discord-blurple/20 scale-[1.02]' 
                      : 'text-discord-muted hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-slideUp">
                <div className="p-8 rounded-[32px] bg-gradient-to-br from-white/5 to-transparent border border-white/10 shadow-xl">
                  <h4 className="text-[11px] font-black text-discord-muted uppercase tracking-[0.2em] mb-4">Compte RP Synchronisé</h4>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[28px] bg-discord-blurple/10 flex items-center justify-center text-discord-blurple shadow-inner border border-discord-blurple/20">
                      <Shield size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-white">{profile?.username || 'Utilisateur'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-discord-success animate-pulse" />
                        <p className="text-sm text-discord-success font-bold">Vérifié via Discord</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 text-sm text-discord-muted leading-relaxed">
                   Les paramètres de votre compte sont automatiquement gérés par la liaison Discord. Pour changer votre nom ou votre avatar, modifiez votre profil sur Discord et attendez la prochaine synchronisation.
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-slideUp">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {THEMES.map(theme => (
                    <button 
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={clsx(
                        'group p-6 rounded-[32px] border text-left transition-all relative overflow-hidden',
                        selectedTheme === theme.id 
                          ? 'bg-discord-blurple/10 border-discord-blurple shadow-2xl shadow-discord-blurple/10' 
                          : 'bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/10'
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={clsx('p-4 rounded-2xl transition-colors', selectedTheme === theme.id ? 'bg-discord-blurple text-white' : 'bg-white/5 text-discord-muted group-hover:text-white')}>
                          <theme.icon size={24} />
                        </div>
                        {selectedTheme === theme.id && <Zap size={16} className="text-discord-blurple fill-current" />}
                      </div>
                      <p className="font-black text-white text-xl">{theme.name}</p>
                      <p className="text-xs text-discord-muted mt-1 leading-relaxed">{theme.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6 animate-slideUp">
                <div className="grid gap-4">
                  {[
                    { id: 'fr', name: 'Français', flag: 'fr' },
                    { id: 'en', name: 'English', flag: 'gb' },
                    { id: 'es', name: 'Español', flag: 'es', disabled: true },
                  ].map((lang) => (
                    <button 
                      key={lang.id}
                      disabled={lang.disabled}
                      onClick={() => setLocale(lang.id as any)}
                      className={clsx(
                        'w-full p-6 rounded-[32px] border flex items-center justify-between transition-all group',
                        locale === lang.id ? 'bg-discord-blurple/10 border-discord-blurple shadow-xl' : 'bg-white/3 border-white/5 hover:bg-white/5',
                        lang.disabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <img 
                          src={`https://flagcdn.com/w40/${lang.flag}.png`} 
                          alt={lang.name}
                          className="w-8 h-auto rounded-sm grayscale-[0.5] group-hover:grayscale-0 transition-all shadow-sm"
                        />
                        <span className={clsx('text-lg font-black', locale === lang.id ? 'text-white' : 'text-discord-muted group-hover:text-white')}>{lang.name}</span>
                      </div>
                      {locale === lang.id && <Check className="text-discord-blurple" size={24} />}
                      {lang.disabled && <span className="text-[10px] font-black text-discord-muted uppercase tracking-widest">Bientôt</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-slideUp">
                 <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 border-dashed text-center">
                    <div className="w-20 h-20 bg-discord-blurple/10 rounded-[30px] flex items-center justify-center mx-auto mb-6 text-discord-blurple">
                      <Bell size={40} />
                    </div>
                    <h4 className="text-xl font-black text-white mb-2">Centre de Notifications</h4>
                    <p className="text-sm text-discord-muted max-w-xs mx-auto mb-8 leading-relaxed">Personnalisez la manière dont vous recevez les alertes du LunaVerse.</p>
                    
                    <div className="max-w-sm mx-auto space-y-4">
                      <div 
                        onClick={toggleWeb}
                        className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-bold text-white">Notifications Web</span>
                        <div className={clsx(
                          "w-12 h-6 rounded-full relative p-1 transition-all",
                          webEnabled ? "bg-discord-success" : "bg-white/10"
                        )}>
                           <div className={clsx(
                             "w-4 h-4 bg-white rounded-full transition-all absolute top-1",
                             webEnabled ? "right-1 shadow-lg shadow-black/20" : "left-1"
                           )} />
                        </div>
                      </div>
                      <div 
                        onClick={toggleDms}
                        className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-bold text-white">Alertes Discord (DM)</span>
                        <div className={clsx(
                          "w-12 h-6 rounded-full relative p-1 transition-all",
                          dmsEnabled ? "bg-discord-blurple" : "bg-white/10"
                        )}>
                           <div className={clsx(
                             "w-4 h-4 bg-white rounded-full transition-all absolute top-1",
                             dmsEnabled ? "right-1 shadow-lg shadow-black/20" : "left-1"
                           )} />
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'admin' && isAdminUser && (
               <div className="space-y-6 animate-slideUp">
                 <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 border-dashed">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-16 h-16 bg-amber-500/10 rounded-[24px] flex items-center justify-center text-amber-500">
                          <Settings size={32} />
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-white">Administration ENT</h4>
                          <p className="text-xs text-discord-muted uppercase tracking-widest font-bold">Paramètres Système</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-3">
                                <Rocket className="text-discord-blurple" size={20} />
                                <span className="font-bold text-white text-lg">Système de Survie Dynamique</span>
                             </div>
                             <div 
                                onClick={!savingAdmin ? toggleDynamicStats : undefined}
                                className={clsx(
                                  "w-14 h-7 rounded-full relative p-1 transition-all cursor-pointer",
                                  dynamicStatsEnabled ? "bg-discord-success" : "bg-white/10",
                                  savingAdmin && "opacity-50"
                                )}
                             >
                                <div className={clsx(
                                  "w-5 h-5 bg-white rounded-full transition-all absolute top-1",
                                  dynamicStatsEnabled ? "right-1 shadow-md shadow-black/20" : "left-1"
                                )} />
                             </div>
                          </div>
                          <p className="text-xs text-discord-muted leading-relaxed">
                             Si activé, les joueurs perdront faim, soif et hygiène avec le temps. Si désactivé, tout le monde reste fixe à 100%.
                          </p>
                       </div>
                    </div>
                 </div>
               </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between mt-auto flex-shrink-0">
          <div className="flex gap-4">
            <button 
              onClick={() => setShowPrivacy(!showPrivacy)}
              className="text-[10px] font-black text-discord-muted uppercase tracking-widest hover:text-white transition-colors"
            >
              Confidentialité
            </button>
            <button className="text-[10px] font-black text-discord-muted uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
              <ExternalLink size={10} /> Support
            </button>
          </div>
          <p className="text-[10px] font-bold text-discord-muted">LunaVerse ENT Evolution V5</p>
        </div>
      </div>
    </div>,
    document.body
  )
}
