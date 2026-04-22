'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Play, Pause, VolumeX, Volume2, Radio, Minimize2, X, Maximize2 } from 'lucide-react'
import clsx from 'clsx'

export default function RadioPlayer() {
  const pathname = usePathname()
  const isPublic = ['/', '/unauthorized'].includes(pathname || '')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [songInfo, setSongInfo] = useState({ 
    title: 'Luna FM Live', 
    artist: 'Station en direct', 
    art: '',
    streamUrl: 'https://a13.asurahosting.com/listen/lunfm/radio.mp3'
  })
  const audioRef = useRef<HTMLAudioElement>(null)

  // Fetch AzuraCast metadata
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('https://a13.asurahosting.com/api/nowplaying', {
          headers: { 'Authorization': 'Bearer 4c4d1bee818be58c:e27f5a7cb9c34e7a50044315504dce59' }
        })
        const data = await res.json()
        let stationData = null;
        if (Array.isArray(data)) {
          stationData = data.find((s: any) => 
            s.station?.shortcode === 'lunfm' || 
            s.station?.name?.toLowerCase().includes('luna')
          ) || data[0];
        } else if (data.now_playing) {
          stationData = data;
        }
        
        if (stationData?.now_playing?.song) {
          setSongInfo({
            title: stationData.now_playing.song.title || 'Luna FM Live',
            artist: stationData.now_playing.song.artist || 'Station en direct',
            art: stationData.now_playing.song.art || '',
            streamUrl: stationData.station?.listen_url || 'https://a13.asurahosting.com/listen/lunfm/radio.mp3'
          })
          
          // Met à jour la source audio si elle est fournie par l'API pour éviter les erreurs de flux
          if (stationData.station?.listen_url && audioRef.current && !audioRef.current.src.includes(stationData.station.listen_url)) {
            // on ne remplace la src que si la radio est arrêtée, sinon ça coupe brutalement !
            // ou on ne la remplace pas si elle marche déja.
          }
        }
      } catch (err) {
        console.error('Failed to fetch AzuraCast metadata', err)
      }
    }

    fetchNowPlaying()
    const interval = setInterval(fetchNowPlaying, 10000)
    return () => clearInterval(interval)
  }, [])

  // Prevent full screen from showing on initial load for mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMinimized(true)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => console.log('Autoplay blocked:', e))
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => setIsMuted(!isMuted)

  const displayVolume = isMuted ? 0 : volume
  const volumePct = Math.round(displayVolume * 100)

  return (
    <>
      <audio
        ref={audioRef}
        src={songInfo.streamUrl}
        preload="none"
      />

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden md:block">
        {isMinimized ? (
          <div className="fixed bottom-6 right-6 z-[9999] animate-scaleIn">
            <button
              onClick={() => setIsMinimized(false)}
              className="w-12 h-12 bg-discord-blurple/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform relative group"
            >
              {isPlaying ? <Radio className="w-5 h-5 animate-pulse text-discord-warning" /> : <Radio className="w-5 h-5" />}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black/80 text-white text-[10px] font-black tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Ouvrir Luna FM
              </div>
            </button>
          </div>
        ) : (
          <div className="fixed bottom-6 right-6 z-[9999] glass-card p-3 flex flex-col gap-3 rounded-2xl shadow-2xl border-white/10 w-64 animate-slideIn group">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex-shrink-0 bg-discord-blurple hover:bg-discord-blurple-dark text-white rounded-xl flex items-center justify-center transition-all shadow-md group-hover:scale-105"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Radio className={clsx("w-3.5 h-3.5 flex-shrink-0", isPlaying ? "text-discord-warning animate-pulse" : "text-discord-muted")} />
                    <span className="text-xs font-black text-white uppercase tracking-widest truncate">
                      {songInfo.title}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="text-discord-muted hover:text-white transition-colors"
                    title="Masquer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="text-discord-muted hover:text-white transition-colors"
                    title="Agrandir"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-discord-muted truncate">
                  {isPlaying ? songInfo.artist : '○ En pause'}
                </p>
              </div>
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-2.5 px-0.5">
              <button
                onClick={toggleMute}
                className="text-discord-muted hover:text-white transition-colors flex-shrink-0"
                title={isMuted ? 'Réactiver' : 'Couper le son'}
              >
                {(isMuted || volume === 0)
                  ? <VolumeX className="w-4 h-4 text-discord-error" />
                  : <Volume2 className="w-4 h-4" />}
              </button>

              <div className="relative flex-1 flex items-center h-6 group/volume">
                <div className="absolute w-full h-2 rounded-full bg-white/10 overflow-hidden border border-white/5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-discord-blurple to-indigo-400 transition-all duration-150"
                    style={{ width: `${volumePct}%` }}
                  />
                </div>
                <input
                  style={{ WebkitAppearance: 'none' }}
                  className="absolute w-full opacity-0 cursor-pointer h-6 z-10"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={displayVolume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value))
                    if (isMuted) setIsMuted(false)
                  }}
                />
                <div
                  className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)] border-2 border-discord-blurple transition-all duration-150 pointer-events-none group-hover/volume:scale-125 group-hover/volume:bg-discord-blurple group-hover/volume:border-white"
                  style={{ left: `calc(${volumePct}% - 8px)` }}
                />
              </div>
              <span className="text-[10px] font-black text-discord-muted w-6 text-right flex-shrink-0">
                {volumePct}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden">
        {isMinimized ? (
          /* Mobile Bar - appears above bottom navigation */
          <div 
            className="fixed left-0 right-0 z-[90] bg-black/80 backdrop-blur-md border-t border-white/10 p-2 flex items-center justify-between"
            style={{ 
              bottom: isPublic 
                ? 'env(safe-area-inset-bottom, 16px)' 
                : 'calc(68px + env(safe-area-inset-bottom, 0px))',
              transition: 'bottom 0.3s ease'
            }}
          >
            <div 
              className="flex items-center gap-3 flex-1 px-2 pointer-events-auto cursor-pointer"
              onClick={() => setIsMinimized(false)}
            >
              <Radio className={clsx("w-5 h-5 flex-shrink-0", isPlaying ? "text-discord-warning animate-pulse" : "text-white")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white uppercase tracking-widest truncate">{songInfo.title}</p>
                <p className="text-xs text-discord-muted truncate">
                  {isPlaying ? songInfo.artist : 'Appuyez pour ouvrir'}
                </p>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                togglePlay()
              }}
              className="w-10 h-10 flex-shrink-0 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all ml-2"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          </div>
        ) : (
          /* Mobile Full Page */
          <div className="fixed inset-0 z-[10000] flex flex-col animate-slideIn" style={{ 
            background: 'var(--discord-dark)',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
          }}>
            <div className="flex-1 flex flex-col p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-12 mt-4">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-xs font-black text-discord-muted uppercase tracking-widest">Lecteur Radio</span>
                <div className="w-10 h-10" />
              </div>

              {/* Artwork / Logo */}
              <div className="w-full aspect-square bg-black/30 rounded-3xl mb-12 flex items-center justify-center shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                 {songInfo.art && songInfo.art !== '' ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={songInfo.art} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                 ) : (
                   <div className="absolute inset-0 bg-gradient-to-br from-discord-blurple/20 to-transparent" />
                 )}
                 {!songInfo.art && <Radio className={clsx("w-32 h-32", isPlaying ? "text-discord-blurple animate-pulse" : "text-white/20")} />}
              </div>

              {/* Info */}
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight truncate px-2">{songInfo.title}</h2>
                <p className="text-discord-muted truncate px-2">
                  {isPlaying ? `${songInfo.artist} ● En direct` : 'Station en pause'}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-8 mb-12">
                <button
                  onClick={toggleMute}
                  className="w-12 h-12 text-discord-muted hover:text-white transition-colors flex items-center justify-center"
                >
                  {(isMuted || volume === 0) ? <VolumeX className="w-6 h-6 text-discord-error" /> : <Volume2 className="w-6 h-6" />}
                </button>

                <button
                  onClick={togglePlay}
                  className="w-20 h-20 bg-discord-blurple text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(88,101,242,0.4)] hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>

                <div className="w-12 h-12" /> {/* Spacer for balance */}
              </div>

              {/* Volume Slider for Mobile */}
              <div className="flex items-center gap-4 mt-auto">
                <VolumeX className="w-5 h-5 text-discord-muted" />
                <div className="relative flex-1 flex items-center h-8 group/volume">
                  <div className="absolute w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-discord-blurple to-indigo-400"
                      style={{ width: `${volumePct}%` }}
                    />
                  </div>
                  <input
                    style={{ WebkitAppearance: 'none' }}
                    className="absolute w-full opacity-0 cursor-pointer h-8 z-10"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={displayVolume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value))
                      if (isMuted) setIsMuted(false)
                    }}
                  />
                </div>
                <Volume2 className="w-5 h-5 text-discord-muted" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- DESKTOP FULLSCREEN OVERLAY --- */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex flex-col animate-fadeIn">
          <div className="flex justify-between items-center p-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-discord-blurple rounded-xl flex items-center justify-center shadow-lg shadow-discord-blurple/20">
                <Radio className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-widest uppercase">Luna FM</h1>
                <p className="text-[10px] font-bold text-discord-muted tracking-widest uppercase">Le son du futur</p>
              </div>
            </div>
            <button 
              onClick={() => setIsFullscreen(false)}
              className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 md:p-12 gap-12 md:gap-24">
            {/* Album Art Container */}
            <div className="relative group">
              <div className="absolute inset-x-0 bottom-[-40px] h-20 bg-discord-blurple/30 blur-[60px] rounded-full scale-110 group-hover:bg-discord-blurple/50 transition-all duration-500" />
              <div className="w-64 h-64 md:w-96 md:h-96 glass-card p-4 rounded-[42px] relative z-10 animate-scaleIn rotate-2 group-hover:rotate-0 transition-transform duration-700">
                <div className="w-full h-full bg-black/20 rounded-[32px] overflow-hidden relative border border-white/5">
                  {songInfo.art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={songInfo.art} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-discord-blurple/10 to-transparent">
                       <Radio className="w-32 h-32 text-discord-blurple opacity-20" />
                       <span className="text-[10px] font-black text-discord-muted tracking-[0.2em]">NO ARTWORK</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Song Details & Main Controls */}
            <div className="text-center md:text-left max-w-xl flex flex-col items-center md:items-start">
              <div className="inline-block px-3 py-1 rounded-full bg-discord-blurple/20 border border-discord-blurple/30 mb-6 animate-slideUp">
                <span className="text-[10px] font-black text-discord-blurple uppercase tracking-[0.3em]">EN DIRECT SUR LUNA FM</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight animate-slideUp">
                {songInfo.title}
              </h2>
              <p className="text-xl md:text-2xl text-discord-muted mb-12 animate-slideUp" style={{ animationDelay: '0.1s' }}>
                {songInfo.artist}
              </p>

              <div className="flex items-center gap-10">
                <button
                  onClick={togglePlay}
                  className="w-24 h-24 bg-discord-blurple text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(88,101,242,0.5)] hover:bg-white hover:text-discord-blurple hover:scale-105 transition-all duration-300"
                >
                  {isPlaying ? <Pause size={42} /> : <Play size={42} className="ml-2" />}
                </button>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <button onClick={toggleMute} className="text-discord-muted hover:text-white transition-colors">
                      {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                    </button>
                    <div className="w-48 h-2 bg-white/10 rounded-full relative overflow-hidden group/vol">
                       <div className="h-full bg-discord-blurple" style={{ width: `${volumePct}%` }} />
                       <input 
                         type="range" min="0" max="1" step="0.01" value={displayVolume} 
                         onChange={(e) => setVolume(parseFloat(e.target.value))}
                         className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer visualizer mock */}
          <div className="h-32 flex items-end justify-center gap-1.5 px-8 pb-12 opacity-30">
            {Array.from({ length: 48 }).map((_, i) => (
              <div 
                key={i} 
                className="w-1 bg-discord-blurple rounded-t-full transition-all duration-300" 
                style={{ 
                  height: isPlaying ? `${Math.random() * 80 + 20}%` : '8px',
                }} 
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

