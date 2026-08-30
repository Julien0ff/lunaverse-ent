'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Heart, X, Flame, MessageCircle, AlertCircle, RefreshCw, Upload, Image as ImageIcon, Camera, ArrowRight, Info, ChevronRight, ChevronLeft, Loader2, Plus } from 'lucide-react'
import clsx from 'clsx'

interface DatingProfile {
  id: string
  username: string
  avatar_url: string
  bio?: string
  dating_bio?: string
  dating_photo_url?: string
  dating_photos?: string[]
  age?: number
}

export default function Dating() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const [profiles, setProfiles] = useState<DatingProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swiping, setSwiping] = useState<'left' | 'right' | null>(null)
  const [matchPopup, setMatchPopup] = useState<DatingProfile | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [tab, setTab] = useState<'swipe' | 'profile'>('swipe')
  const [datingPhotos, setDatingPhotos] = useState<string[]>([])
  const [datingBio, setDatingBio] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dating/profiles')
      const data = await res.json()
      if (data.items) {
        setProfiles(data.items)
        setCurrentIndex(0)
      }
    } catch (e) {
      console.error(e)
      setErrorMsg(t('dating_page.loading_error') || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (profile?.id) {
       const p = profile as any
       setDatingPhotos(p.dating_photos || (p.dating_photo_url ? [p.dating_photo_url] : []))
       setDatingBio(p.dating_bio || '')
       fetchProfiles()
    }
  }, [profile, fetchProfiles])

  useEffect(() => {
    setPhotoIndex(0)
  }, [currentIndex])

  const showMsg = (msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 3000)
  }

  const saveDatingProfile = async () => {
    setSavingProfile(true)
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dating_photo_url: datingPhotos[0] || null, dating_photos: datingPhotos, dating_bio: datingBio })
      })
      showMsg(t('dating_page.profile_saved') || 'Profil sauvegardé')
    } finally {
      setSavingProfile(false)
    }
  }

  const uploadDatingPhoto = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/dating/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setDatingPhotos(prev => [...prev, data.url])
        showMsg(t('dating_page.photo_added') || 'Photo ajoutée')
      } else {
        showMsg(data.error || 'Erreur upload')
      }
    } finally {
      setUploadingPhoto(false)
    }
  }

  const resetSeenProfiles = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/dating/reset', { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        showMsg('✅ ' + data.message)
        setCurrentIndex(0)
        fetchProfiles()
      } else {
        showMsg(data.error)
      }
    } finally {
      setResetting(false)
    }
  }

  const handleSwipe = async (liked: boolean) => {
    if (currentIndex >= profiles.length || swiping) return
    const target = profiles[currentIndex]
    
    setSwiping(liked ? 'right' : 'left')
    
    try {
      const res = await fetch('/api/dating/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: target.id, liked })
      })
      const data = await res.json()
      
      setTimeout(() => {
        setSwiping(null)
        setCurrentIndex(prev => prev + 1)
        if (data.isMatch) {
          setMatchPopup(target)
        }
      }, 400) // Match the CSS animation duration
    } catch (e) {
      console.error(e)
      setSwiping(null)
    }
  }

  const currentProfile = profiles[currentIndex]
  const cPhotos = currentProfile?.dating_photos?.length ? currentProfile.dating_photos : (currentProfile?.dating_photo_url ? [currentProfile.dating_photo_url] : [currentProfile?.avatar_url])
  const activePhoto = cPhotos[photoIndex]

  return (
    <div className="page-container h-[calc(100vh-80px)] overflow-hidden flex flex-col relative px-4 md:px-0">
      
      {/* ── Background Glow ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none opacity-50" />

      {/* ── Header ── */}
      <div className="text-center mb-6 z-10 flex flex-col items-center animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-600 flex items-center justify-center gap-3 tracking-tighter italic">
          <Flame className="w-10 h-10 text-rose-500 fill-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" /> LunaMatch
        </h1>
        
        {/* Modern Tabs */}
        <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1.5 mt-6 border border-white/5 shadow-2xl">
           <button 
             onClick={() => setTab('swipe')} 
             className={clsx(
               "px-6 py-2.5 rounded-full text-sm font-black transition-all duration-300 flex items-center gap-2", 
               tab === 'swipe' ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25" : "text-white/40 hover:text-white"
             )}
           >
             <Flame className="w-4 h-4" /> Rencontres
           </button>
           <button 
             onClick={() => setTab('profile')} 
             className={clsx(
               "px-6 py-2.5 rounded-full text-sm font-black transition-all duration-300 flex items-center gap-2", 
               tab === 'profile' ? "bg-white/10 text-white shadow-lg backdrop-blur-md border border-white/10" : "text-white/40 hover:text-white"
             )}
           >
             <Camera className="w-4 h-4" /> Mon Profil
           </button>
        </div>
      </div>

      {/* ── Notifications ── */}
      {errorMsg && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-bold border border-white/10 shadow-2xl flex items-center gap-2 animate-bounce">
          <Info className="w-4 h-4 text-rose-400" /> {errorMsg}
        </div>
      )}

      {/* ── Match Popup ── */}
      {matchPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fadeIn">
          {/* Confetti / Glow effects could go here */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.2)_0%,transparent_70%)]" />
          
          <div className="text-center p-8 relative z-10 flex flex-col items-center">
            <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-2 tracking-tighter">
              MATCH!
            </h2>
            <p className="text-rose-400 text-xl font-medium mb-12 italic">
              Vous avez un match avec {matchPopup.username}
            </p>
            
            <div className="flex items-center gap-6 mb-12">
              <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-br from-rose-400 to-pink-600 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
                <Image src={profile?.avatar_url || ''} alt="You" fill className="rounded-full object-cover border-4 border-black" />
              </div>
              <Heart className="w-12 h-12 text-rose-500 fill-rose-500 animate-pulse" />
              <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-br from-rose-400 to-pink-600 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
                <Image src={matchPopup.avatar_url || ''} alt="Them" fill className="rounded-full object-cover border-4 border-black" />
              </div>
            </div>

            <button 
              onClick={() => setMatchPopup(null)}
              className="group relative px-8 py-4 bg-white text-black font-black rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              Continuer à swiper
            </button>
          </div>
        </div>
      )}

      {/* ── Swipe Area ── */}
      {tab === 'swipe' && (
        <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-sm mx-auto z-10 perspective-1000">
          {loading ? (
             <div className="flex flex-col items-center text-rose-500">
               <Flame className="w-12 h-12 animate-pulse mb-4" />
               <p className="font-bold tracking-widest text-sm uppercase">Recherche en cours...</p>
             </div>
          ) : !currentProfile ? (
            <div className="text-center p-8 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl w-full">
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Flame className="w-10 h-10 text-rose-500/50" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Plus de profils</h3>
              <p className="text-discord-muted text-sm mb-8 leading-relaxed">
                Vous avez vu tous les profils disponibles pour le moment. Revenez plus tard ou réinitialisez vos vues !
              </p>
              <button 
                onClick={resetSeenProfiles} 
                disabled={resetting}
                className="w-full py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold transition-colors flex items-center justify-center gap-2 border border-white/10"
              >
                {resetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Revoir les profils
              </button>
            </div>
          ) : (
            <>
              {/* Profile Card Container */}
              <div 
                className={clsx(
                  "relative w-full aspect-[3/4] rounded-[2rem] overflow-hidden bg-zinc-900 shadow-2xl transition-all duration-300 border border-white/10",
                  swiping === 'left' && "-translate-x-full rotate-[-15deg] opacity-0",
                  swiping === 'right' && "translate-x-full rotate-[15deg] opacity-0"
                )}
              >
                {/* Image */}
                {activePhoto ? (
                  <Image src={activePhoto} alt={currentProfile.username} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-white/20" />
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                
                {/* Photo Pagination Indicators */}
                {cPhotos.length > 1 && (
                  <div className="absolute top-4 left-0 w-full px-4 flex gap-1.5 z-20">
                    {cPhotos.map((_, i) => (
                      <div key={i} className={clsx("h-1 flex-1 rounded-full transition-colors", i === photoIndex ? "bg-white" : "bg-white/30 backdrop-blur-sm")} />
                    ))}
                  </div>
                )}
                
                {/* Tap Zones for Photos */}
                <div className="absolute inset-0 z-10 flex">
                  <div className="w-1/2 h-full" onClick={() => setPhotoIndex(p => Math.max(0, p - 1))} />
                  <div className="w-1/2 h-full" onClick={() => setPhotoIndex(p => Math.min(cPhotos.length - 1, p + 1))} />
                </div>

                {/* Profile Info */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 pointer-events-none">
                  <div className="flex items-end justify-between mb-2">
                    <h2 className="text-3xl font-black text-white drop-shadow-md">
                      {currentProfile.username} <span className="text-2xl font-light text-white/80">{currentProfile.age}</span>
                    </h2>
                  </div>
                  
                  {currentProfile.dating_bio && (
                    <p className="text-white/90 text-sm line-clamp-3 leading-relaxed drop-shadow-md">
                      {currentProfile.dating_bio}
                    </p>
                  )}
                  
                  {/* Swipe Overlay Indicators */}
                  {swiping === 'right' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 border-4 border-rose-500 rounded-2xl px-6 py-2 text-4xl font-black rotate-[-15deg] uppercase">Like</div>}
                  {swiping === 'left' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white border-4 border-white rounded-2xl px-6 py-2 text-4xl font-black rotate-[15deg] uppercase">Nope</div>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-6 mt-8">
                <button 
                  onClick={() => handleSwipe(false)}
                  disabled={!!swiping}
                  className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/5 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => handleSwipe(true)}
                  disabled={!!swiping}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(244,63,94,0.3)] hover:shadow-[0_0_40px_rgba(244,63,94,0.5)] disabled:opacity-50"
                >
                  <Heart className="w-10 h-10 fill-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Profile Area ── */}
      {tab === 'profile' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar w-full max-w-sm mx-auto z-10 pb-20">
          <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6">Éditer le profil</h2>
            
            {/* Photos Grid */}
            <div className="space-y-3 mb-8">
              <label className="text-xs font-black text-discord-muted uppercase tracking-widest flex justify-between">
                <span>Photos</span>
                <span>{datingPhotos.length}/6</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="aspect-[3/4] relative rounded-xl overflow-hidden bg-white/5 border border-white/5 group">
                    {datingPhotos[i] ? (
                      <>
                        <Image src={datingPhotos[i]} alt="Photo" fill className="object-cover" />
                        <button 
                          onClick={() => setDatingPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute bottom-1 right-1 bg-red-500 w-6 h-6 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : i === datingPhotos.length ? (
                      <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) uploadDatingPhoto(e.target.files[0])
                          }} 
                        />
                        {uploadingPhoto ? <Loader2 className="w-5 h-5 text-rose-500 animate-spin" /> : <Plus className="w-6 h-6 text-rose-500" />}
                      </label>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/10 font-black">{i + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed">
                Ajoutez jusqu'à 6 photos. La première photo sera votre photo principale. Cliquez sur le + pour ajouter une photo.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-3 mb-8">
              <label className="text-xs font-black text-discord-muted uppercase tracking-widest">
                À propos de moi
              </label>
              <textarea
                value={datingBio}
                onChange={e => setDatingBio(e.target.value)}
                placeholder="Rédigez une bio sympa pour attirer l'attention..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-colors resize-none h-32"
                maxLength={500}
              />
              <p className="text-right text-[10px] text-white/40 font-mono">
                {datingBio.length}/500
              </p>
            </div>

            <button 
              onClick={saveDatingProfile}
              disabled={savingProfile}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2"
            >
              {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sauvegarder le profil'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
