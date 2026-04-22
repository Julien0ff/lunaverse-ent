'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Heart, X, Flame, Sparkles, MessageCircle, AlertCircle } from 'lucide-react'
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
      setErrorMsg('Erreur lors du chargement des profils')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile?.id) {
       const p = profile as any
       setDatingPhotos(p.dating_photos || (p.dating_photo_url ? [p.dating_photo_url] : []))
       setDatingBio(p.dating_bio || '')
       fetchProfiles()
    }
  }, [profile, fetchProfiles])

  const saveDatingProfile = async () => {
    setSavingProfile(true)
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dating_photo_url: datingPhotos[0] || null, dating_photos: datingPhotos, dating_bio: datingBio })
      })
      setErrorMsg('Profil sauvegardé ! 🎉')
      setTimeout(() => setErrorMsg(null), 3000)
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
        setErrorMsg('Photo ajoutée ! 🎨')
        setTimeout(() => setErrorMsg(null), 3000)
      } else {
        setErrorMsg(data.error || 'Erreur upload')
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
        setErrorMsg('✅ ' + data.message)
        setCurrentIndex(0)
        fetchProfiles()
      } else {
        setErrorMsg(data.error)
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
      }, 500)
    } catch (e) {
      console.error(e)
      setSwiping(null)
    }
  }

  const currentProfile = profiles[currentIndex]
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    setPhotoIndex(0) // Reset photo index when profile changes
  }, [currentIndex])

  return (
    <div className="page-container h-[calc(100vh-80px)] overflow-hidden flex flex-col relative">
      <div className="text-center mb-6 animate-slideIn flex flex-col items-center">
        <h1 className="text-3xl font-black text-rose-500 flex items-center justify-center gap-2 tracking-tight">
          <Flame className="w-8 h-8 fill-rose-500" /> Luna Match
        </h1>
        <p className="text-discord-muted text-sm mt-1 uppercase tracking-widest font-bold">Trouvez votre moitié RP</p>
        
        <div className="flex bg-white/5 rounded-xl p-1 mt-4">
           <button onClick={() => setTab('swipe')} className={clsx("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", tab === 'swipe' ? "bg-rose-500 text-white" : "text-discord-muted hover:text-white")}>
             Swiper
           </button>
           <button onClick={() => setTab('profile')} className={clsx("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", tab === 'profile' ? "bg-rose-500 text-white" : "text-discord-muted hover:text-white")}>
             Mon Profil
           </button>
        </div>
      </div>

      {matchPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="text-center p-8 animate-bounce">
            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 mb-4 italic tracking-tighter">
              C&apos;EST UN MATCH !
            </h2>
            <p className="text-white/80 text-lg sm:text-xl font-medium mb-8">
              Toi et <span className="font-bold text-white">{matchPopup.username}</span> avez liké vos profils respectifs.
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setMatchPopup(null)}
                className="btn bg-rose-500 hover:bg-rose-600 text-white font-black py-4 px-8 rounded-full shadow-lg shadow-rose-500/50 flex items-center gap-3 mx-auto"
              >
                <MessageCircle className="w-5 h-5" /> Parler dans l&apos;onglet Amis
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'profile' ? (
        <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full animate-fadeIn">
           <div className="glass-card w-full space-y-5">
             <h2 className="text-xl font-black text-white">Mon Profil Dating</h2>
             <p className="text-sm text-discord-muted">Pour apparaître et trouver des profils, ajoutez au moins une photo et une bio pour Luna Match (opt-in).</p>

             {/* Photo upload */}
             <div>
               <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2 block flex justify-between">
                 <span>Photos de profil</span>
                 <span>{datingPhotos.length}/5</span>
               </label>
               
               {datingPhotos.length > 0 && (
                 <div className="grid grid-cols-3 gap-2 mb-3">
                   {datingPhotos.map((url, i) => (
                     <div key={i} className="relative group">
                       <img src={url} alt={`Photo ${i+1}`} className="w-full aspect-square rounded-xl object-cover ring-2 ring-rose-500/30" />
                       <button 
                         onClick={() => setDatingPhotos(prev => prev.filter((_, idx) => idx !== i))}
                         className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
               
               {datingPhotos.length < 5 && (
                 <label className={clsx(
                   'flex flex-col items-center justify-center gap-1 w-full py-4 px-4 rounded-xl border-2 border-dashed text-sm font-bold cursor-pointer transition-all',
                   uploadingPhoto
                     ? 'border-rose-500/40 text-rose-400 animate-pulse'
                     : 'border-white/15 text-discord-muted hover:border-rose-500/50 hover:text-rose-400'
                 )}>
                   <span className="text-xl">📸</span>
                   <span className="text-center">{uploadingPhoto ? 'Upload en cours...' : 'Ajouter une photo'}</span>
                   <span className="text-[10px] opacity-60">JPG, PNG, WEBP max 5 Mo</span>
                   <input
                     type="file" className="hidden" accept="image/*"
                     disabled={uploadingPhoto}
                     onChange={e => {
                       const file = e.target.files?.[0]
                       if (file) uploadDatingPhoto(file)
                     }}
                   />
                 </label>
               )}
             </div>

             {/* Bio */}
             <div>
               <label className="text-xs font-black text-discord-muted uppercase tracking-widest mb-1 block">Bio Luna Match</label>
               <textarea placeholder="Petite bio..." className="glass-input text-sm" rows={3} value={datingBio} onChange={e => setDatingBio(e.target.value)} />
             </div>

             <button onClick={saveDatingProfile} disabled={savingProfile} className="btn bg-rose-500 hover:bg-rose-600 text-white w-full shadow-lg shadow-rose-500/20">
               {savingProfile ? 'Chargement...' : 'Sauvegarder mon profil'}
             </button>

             {/* Reset */}
             <div className="border-t border-white/8 pt-4">
               <p className="text-xs text-discord-muted mb-2">Vous avez vu tous les profils ? Réinitialisez pour recommencer.</p>
               <button
                 onClick={resetSeenProfiles}
                 disabled={resetting}
                 className="btn bg-white/5 hover:bg-white/10 text-discord-muted hover:text-white w-full text-sm"
               >
                 {resetting ? 'Réinitialisation...' : '🔄 Réinitialiser les profils RENCONTRE'}
               </button>
             </div>

             {errorMsg && <p className="text-discord-success text-center text-sm font-bold">{errorMsg}</p>}
           </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 relative animate-pulse mb-6">
            <Heart className="w-full h-full text-rose-500/20" />
            <Sparkles className="w-10 h-10 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>
          <p className="font-bold text-discord-muted uppercase tracking-widest animate-pulse">Recherche en cours...</p>
        </div>
      ) : currentProfile ? (
        <div className="flex-1 flex flex-col items-center max-w-sm mx-auto w-full relative h-[60vh] max-h-[600px] perspective-1000">
          
          <div className={clsx("w-full h-[85%] relative preserve-3d shadow-2xl shadow-rose-500/10 rounded-3xl overflow-hidden glass-card transition-transform duration-500", swiping === 'left' ? '-translate-x-full rotate-[-20deg] opacity-0' : swiping === 'right' ? 'translate-x-full rotate-[20deg] opacity-0' : '')}>
            
            {/* Carousel navigation areas */}
            {(() => {
              const profilePhotos = currentProfile.dating_photos?.length ? currentProfile.dating_photos : (currentProfile.dating_photo_url ? [currentProfile.dating_photo_url] : [])
              const showPhoto = profilePhotos[photoIndex] || currentProfile.avatar_url
              return (
                <>
                  {showPhoto ? (
                    <img src={showPhoto} alt={currentProfile.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-rose-500/20 to-purple-800/40 flex items-center justify-center text-rose-500/50">
                      <Heart className="w-32 h-32" />
                    </div>
                  )}

                  {/* Photo indicators */}
                  {profilePhotos.length > 1 && (
                    <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
                      {profilePhotos.map((_, i) => (
                        <div key={i} className={clsx("h-1 rounded-full flex-1 transition-all", i === photoIndex ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-white/30")} />
                      ))}
                    </div>
                  )}

                  {/* Invisible tap zones for navigating photos */}
                  {profilePhotos.length > 1 && (
                    <>
                      <div className="absolute top-0 left-0 w-1/2 h-2/3 z-10 cursor-pointer" onClick={() => setPhotoIndex(prev => Math.max(0, prev - 1))} />
                      <div className="absolute top-0 right-0 w-1/2 h-2/3 z-10 cursor-pointer" onClick={() => setPhotoIndex(prev => Math.min(profilePhotos.length - 1, prev + 1))} />
                    </>
                  )}
                </>
              )
            })()}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            
            <div className="absolute bottom-0 left-0 w-full p-6 text-white">
              <h2 className="text-4xl font-black mb-1 flex items-end gap-2">
                {currentProfile.username} 
                {currentProfile.age && <span className="text-xl font-normal text-white/80">{currentProfile.age}</span>}
              </h2>
              {errorMsg && (
                <div className="mt-2 text-xs font-bold text-discord-error">{errorMsg}</div>
              )}
              <div className="flex items-center gap-2 mb-3 text-sm text-rose-200">
                <AlertCircle className="w-4 h-4" /> RP Uniquement
              </div>
              {(currentProfile.dating_bio || currentProfile.bio) && (
                <p className="text-white/80 font-medium leading-relaxed">{currentProfile.dating_bio || currentProfile.bio}</p>
              )}
            </div>
          </div>

          <div className="w-full h-[15%] flex justify-center items-center gap-8 mt-4">
            <button 
              onClick={() => handleSwipe(false)}
              className="w-20 h-20 rounded-full bg-discord-dark flex items-center justify-center text-discord-error hover:bg-discord-error hover:text-white transition-all shadow-xl shadow-discord-dark border-4 border-discord-error/20 hover:scale-110 active:scale-95"
            >
              <X className="w-10 h-10" />
            </button>
            <button 
              onClick={() => handleSwipe(true)}
              className="w-20 h-20 rounded-full bg-discord-dark flex items-center justify-center text-discord-success hover:bg-discord-success hover:text-white transition-all shadow-xl shadow-discord-dark border-4 border-discord-success/20 hover:scale-110 active:scale-95"
            >
              <Heart className="w-8 h-8 fill-current stroke-[3] group-hover:scale-110 transition-transform" />
            </button>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-discord-muted" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Plus de profils</h2>
          <p className="text-discord-muted">Revenez plus tard pour découvrir d&apos;autres personnes.</p>
        </div>
      )}
    </div>
  )
}
