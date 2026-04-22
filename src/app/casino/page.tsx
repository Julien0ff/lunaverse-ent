'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Dices, TrendingDown, Sparkles, Trophy, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

interface CasinoGame {
  id: string
  name: string
  description: string
  min_bet: number
  max_bet: number
}

const SLOT_SYMBOLS = ['🍒', '🍋', '🍇', '💎', '⭐', '🎰']
const COIN_OPTIONS = [
  { value: 'heads', label: 'Pile 🪙', icon: '🪙' },
  { value: 'tails', label: 'Face 🦅', icon: '🦅' },
]
const DICE_OPTIONS = [
  { value: 'high', label: 'Haut (>50)', desc: '× 1.8' },
  { value: 'low', label: 'Bas (≤50)', desc: '× 1.8' },
]

// ─── Big result overlay ──────────────────────────────────────────
function ResultOverlay({ result, onClose }: { result: 'win' | 'lose' | null; onClose: () => void }) {
  useEffect(() => {
    if (!result) return
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [result, onClose])

  if (!result) return null

  const isWin = result === 'win'
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center cursor-pointer"
      style={{ background: isWin ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div className={clsx(
        'flex flex-col items-center justify-center gap-6 p-12 rounded-3xl border-4 animate-scaleIn shadow-2xl',
        isWin
          ? 'bg-discord-success/15 border-discord-success/60 shadow-green-500/30'
          : 'bg-discord-error/15 border-discord-error/60 shadow-red-500/30'
      )}>
        <div className="text-8xl select-none" style={{ filter: isWin ? 'drop-shadow(0 0 30px #57F287)' : 'drop-shadow(0 0 30px #ED4245)' }}>
          {isWin ? '🏆' : '💀'}
        </div>
        <div className={clsx(
          'text-6xl font-black tracking-tighter text-center leading-none',
          isWin ? 'text-discord-success' : 'text-discord-error'
        )}>
          {isWin ? 'VICTOIRE !' : 'DÉFAITE !'}
        </div>
        <div className={clsx('text-sm font-bold uppercase tracking-widest', isWin ? 'text-discord-success/60' : 'text-discord-error/60')}>
          Cliquez pour continuer
        </div>
      </div>
    </div>
  )
}

export default function CasinoPage() {
  const { profile, refreshProfile } = useAuth()
  const [games, setGames] = useState<CasinoGame[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<CasinoGame | null>(null)
  const [bet, setBet] = useState('')
  const [guess, setGuess] = useState('')
  const [message, setMessage] = useState<{ type: 'win' | 'lose' | 'error'; text: string } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [slotResult, setSlotResult] = useState<string[]>(['🎰', '🎰', '🎰'])
  // Session stats (live this session, synced from API on load)
  const [stats, setStats] = useState({ wins: 0, losses: 0, totalWon: 0 })
  const [statsLoaded, setStatsLoaded] = useState(false)
  // Big overlay
  const [overlayResult, setOverlayResult] = useState<'win' | 'lose' | null>(null)

  const messageTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const spinIntervalRef = useRef<ReturnType<typeof setInterval>>()
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const unmountedRef = useRef(false)
  const winAudioRef = useRef<HTMLAudioElement | null>(null)
  const loseAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    unmountedRef.current = false
    // Preload audio
    winAudioRef.current = new Audio('https://cdn.freesound.org/previews/270/270545_5123851-lq.mp3')
    loseAudioRef.current = new Audio('https://cdn.freesound.org/previews/331/331912_3248244-lq.mp3')
    winAudioRef.current.volume = 0.2
    loseAudioRef.current.volume = 0.2
    const t1 = messageTimerRef.current
    const t2 = spinIntervalRef.current
    const t3 = spinTimeoutRef.current
    return () => {
      unmountedRef.current = true
      clearTimeout(t1)
      clearInterval(t2)
      clearTimeout(t3)
    }
  }, [])

  // Load games
  useEffect(() => {
    fetch('/api/casino/games')
      .then(r => r.json())
      .then(d => {
        if (unmountedRef.current) return
        const g = d.games || []
        setGames(g)
        if (g.length > 0) setSelectedGame(g[0])
      })
      .catch(console.error)
      .finally(() => { if (!unmountedRef.current) setLoading(false) })
  }, [])

  // Sync casino stats from profile API on first load
  useEffect(() => {
    if (statsLoaded) return
    fetch('/api/profile/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !unmountedRef.current) {
          setStats({
            wins: d.casinoWins ?? 0,
            losses: d.casinoLosses ?? 0,
            totalWon: (d.totalWon ?? 0) - (d.totalLost ?? 0), // Net gain
          })
          setStatsLoaded(true)
        }
      })
      .catch(console.error)
  }, [statsLoaded])

  const handlePlay = async (gameType: string) => {
    if (!profile || !bet || !selectedGame) return
    const betAmount = parseFloat(bet)

    if (isNaN(betAmount) || betAmount <= 0) { showMessage('error', 'Montant invalide.'); return }
    if (betAmount < selectedGame.min_bet || betAmount > selectedGame.max_bet) {
      showMessage('error', `Mise entre ${selectedGame.min_bet}€ et ${selectedGame.max_bet}€.`); return
    }
    if (profile.balance < betAmount) { showMessage('error', 'Solde insuffisant.'); return }
    if ((gameType === 'coin' || gameType === 'dice') && !guess) {
      showMessage('error', 'Choisissez votre pari.'); return
    }

    setSpinning(true)
    setMessage(null)

    if (gameType === 'slots') {
      spinIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) return
        setSlotResult([
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        ])
      }, 100)
      setTimeout(() => clearInterval(spinIntervalRef.current), 900)
    }

    try {
      const res = await fetch('/api/casino/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: selectedGame.id, bet: betAmount, game_type: gameType, guess }),
      })
      const data = await res.json()

      if (res.ok) {
        const isWin = data.isWin
        
        // Wait for animation
        const animDuration = gameType === 'slots' ? 1000 : 600
        
        setTimeout(() => {
          if (unmountedRef.current) return
          
          if (gameType === 'slots' && data.result) {
            const parts = data.result.split(' ')
            setSlotResult(parts.length === 3 ? parts : [parts[0] || '?', parts[1] || '?', parts[2] || '?'])
          }
          if (gameType === 'coin' && data.result) {
            setSlotResult([data.result === 'heads' ? '🪙' : '🦅'])
          }
          if (gameType === 'dice' && data.result) {
            const diceIcons = ['⚀','⚁','⚂','⚃','⚄','⚅']
            const diceVal = parseInt(data.result)
            setSlotResult([diceIcons[(diceVal % 6)] || '🎲'])
          }

          showMessage(isWin ? 'win' : 'lose', data.message || (isWin ? `Gagné ${data.winAmount}€ !` : `Perdu ${betAmount}€.`))

          // Incremental session stats
          if (isWin) {
            setStats(s => ({ ...s, wins: s.wins + 1, totalWon: s.totalWon + (data.winAmount - betAmount) }))
          } else {
            setStats(s => ({ ...s, losses: s.losses + 1, totalWon: s.totalWon - betAmount }))
          }

          setOverlayResult(isWin ? 'win' : 'lose')
          try {
            if (isWin) winAudioRef.current?.play().catch(() => {})
            else loseAudioRef.current?.play().catch(() => {})
          } catch { /* audio blocked */ }
          
          setSpinning(false)
          refreshProfile()
          // Update local session stats if needed, but refreshProfile handles the global state
        }, animDuration)
        
      } else {
        showMessage('error', data.error || 'Erreur.')
        setSpinning(false)
      }
    } catch {
      showMessage('error', 'Erreur de connexion.')
      setSpinning(false)
    }
  }

  const showMessage = (type: 'win' | 'lose' | 'error', text: string) => {
    if (unmountedRef.current) return
    clearTimeout(messageTimerRef.current)
    setMessage({ type, text })
    messageTimerRef.current = setTimeout(() => {
      if (!unmountedRef.current) setMessage(null)
    }, 5000)
  }

  const currentGameType = selectedGame?.name?.toLowerCase().includes('coin') || selectedGame?.name?.toLowerCase().includes('pile') ? 'coin'
    : selectedGame?.name?.toLowerCase().includes('dice') || selectedGame?.name?.toLowerCase().includes('dé') ? 'dice'
      : selectedGame?.name?.toLowerCase().includes('roulette') ? 'roulette'
        : selectedGame?.name?.toLowerCase().includes('blackjack') ? 'blackjack'
          : 'slots'

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-white/5 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-white/5 rounded" />
            <div className="h-3 w-20 bg-white/5 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[1, 2].map(i => <div key={i} className="h-64 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Big win/lose overlay */}
      <ResultOverlay result={overlayResult} onClose={() => setOverlayResult(null)} />

      {/* Header */}
      <div className="animate-slideIn">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="text-5xl">🎰</span>
              Casino
            </h1>
            <p className="text-discord-muted mt-1 font-medium">Tentez votre chance et multipliez vos gains !</p>
          </div>
          {/* Session stats */}
          <div className="hidden md:flex items-center gap-6 px-5 py-3 bg-white/5 border border-white/8 rounded-2xl">
            <div className="text-center">
              <p className="text-xs font-black text-discord-muted uppercase tracking-widest">Victoires</p>
              <p className="text-xl font-black text-discord-success">{stats.wins}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-xs font-black text-discord-muted uppercase tracking-widest">Défaites</p>
              <p className="text-xl font-black text-discord-error">{stats.losses}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-xs font-black text-discord-muted uppercase tracking-widest">Gains nets</p>
              <p className={clsx('text-xl font-black', stats.totalWon >= 0 ? 'text-discord-success' : 'text-discord-error')}>
                {stats.totalWon >= 0 ? '+' : ''}{stats.totalWon.toFixed(0)}€
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance pills */}
      <div className="flex flex-wrap items-center gap-3 animate-fadeIn">
        <div className="px-4 py-2 bg-discord-blurple/15 border border-discord-blurple/25 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-discord-success animate-pulse" />
          <span className="text-sm font-bold text-white">Solde : {profile?.balance.toFixed(0)} €</span>
        </div>
        
        {(profile as any)?.dirty_balance > 0 && (
          <div className="px-4 py-2 bg-red-500/15 border border-red-500/25 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-bold text-red-100">Argent Sale : {(profile as any).dirty_balance.toFixed(0)} €</span>
          </div>
        )}

        {(profile as any)?.casino_streak > 0 && (
          <div className={clsx(
            "px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce border shadow-lg transition-all",
            (profile as any).casino_streak >= 3 
              ? "bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-orange-500/20" 
              : "bg-white/5 border-white/10 text-white"
          )}>
            <Sparkles className={clsx("w-4 h-4", (profile as any).casino_streak >= 3 && "animate-pulse")} />
            <span className="text-sm font-black">SÉRIE : {(profile as any).casino_streak} 🔥</span>
          </div>
        )}

        {(profile as any)?.casino_streak >= 3 && (
          <div className="px-4 py-2 bg-discord-error/20 border border-discord-error/40 rounded-xl flex items-center gap-2 text-discord-error shadow-lg shadow-discord-error/10">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-black uppercase tracking-tighter">Risque : -{(profile as any).streak_accumulated_winnings?.toFixed(0)}€ en cas de défaite !</span>
          </div>
        )}
      </div>

      {/* No games fallback */}
      {games.length === 0 ? (
        <div className="casino-card text-center py-16">
          <div className="text-6xl mb-4">🎰</div>
          <h2 className="text-xl font-bold text-white mb-2">Aucun jeu disponible</h2>
          <p className="text-discord-muted">Les jeux de casino seront bientôt disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game selector */}
          <div className="space-y-2">
            <p className="text-xs font-black text-discord-muted uppercase tracking-widest px-1 mb-3">Choisir un jeu</p>
            {games.map(game => (
              <button
                key={game.id}
                onClick={() => { setSelectedGame(game); setMessage(null); setGuess('') }}
                className={clsx(
                  'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                  selectedGame?.id === game.id
                    ? 'bg-discord-blurple/20 border-discord-blurple/40 shadow-lg shadow-discord-blurple/10'
                    : 'bg-white/3 border-white/7 hover:bg-white/6 hover:border-white/12'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {game.name.toLowerCase().includes('slot') || game.name.toLowerCase().includes('machine') ? '🎰'
                      : game.name.toLowerCase().includes('coin') || game.name.toLowerCase().includes('pile') ? '🪙'
                        : game.name.toLowerCase().includes('dé') || game.name.toLowerCase().includes('dice') ? '🎲'
                          : game.name.toLowerCase().includes('roulette') ? '🎡'
                            : game.name.toLowerCase().includes('blackjack') ? '🃏'
                              : '🎮'}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{game.name}</p>
                    <p className="text-xs text-discord-muted">{game.min_bet}€ — {game.max_bet}€</p>
                  </div>
                  {selectedGame?.id === game.id && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-discord-blurple" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Main game area */}
          {selectedGame && (
            <div className="lg:col-span-2 casino-card space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">{selectedGame.name}</h2>
                <p className="text-discord-muted text-sm mt-1">{selectedGame.description}</p>
              </div>

              {/* Slots reels */}
              {currentGameType === 'slots' && (
                <div className="relative py-8 bg-black/40 border border-white/5 rounded-3xl overflow-hidden shadow-inner">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-discord-blurple/10 blur-2xl rounded-full" />
                  <div className="relative flex items-center justify-center gap-4 z-10">
                    {slotResult.map((sym, i) => (
                      <div
                        key={i}
                        className={clsx(
                          'slot-reel w-20 h-24 flex items-center justify-center text-5xl bg-white/5 border-2 rounded-2xl shadow-lg',
                          spinning ? 'spinning border-discord-blurple/50' : 'border-white/10'
                        )}
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        {sym}
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-red-500/30 z-20 mix-blend-overlay shadow-[0_0_10px_rgba(239,68,68,0.5)] pointer-events-none" />
                </div>
              )}

              {/* Coin flip visual */}
              {currentGameType === 'coin' && (
                <div className="flex flex-col items-center gap-6">
                   <div className={clsx(
                     "w-24 h-24 rounded-full bg-yellow-500 border-4 border-yellow-600 flex items-center justify-center text-5xl shadow-2xl transition-all duration-500",
                     spinning && "animate-spin"
                   )}>
                     {spinning ? '🪙' : (slotResult[0] || '🪙')}
                   </div>
                   <div className="grid grid-cols-2 gap-3 w-full">
                      {COIN_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setGuess(opt.value)}
                          className={clsx(
                            'p-4 rounded-2xl border transition-all duration-200 text-center font-bold',
                            guess === opt.value
                              ? 'bg-discord-blurple/20 border-discord-blurple text-white'
                              : 'bg-white/4 border-white/8 text-discord-muted hover:bg-white/8'
                          )}
                        >
                          <div className="text-3xl mb-1">{opt.icon}</div>
                          <span className="text-sm">{opt.label}</span>
                          <div className="text-xs text-discord-success mt-1">× 1.9</div>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {/* Dice choice */}
              {currentGameType === 'dice' && (
                <div className="flex flex-col items-center gap-6">
                   <div className={clsx(
                     "w-24 h-24 bg-white rounded-2xl border-4 border-gray-200 flex items-center justify-center text-6xl shadow-xl transition-all duration-500",
                     spinning && "animate-bounce"
                   )}>
                     {spinning ? '🎲' : (slotResult[0] || '🎲')}
                   </div>
                   <div className="grid grid-cols-2 gap-3 w-full">
                      {DICE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setGuess(opt.value)}
                          className={clsx(
                            'p-4 rounded-2xl border transition-all duration-200 text-center font-bold',
                            guess === opt.value
                              ? 'bg-discord-blurple/20 border-discord-blurple text-white'
                              : 'bg-white/4 border-white/8 text-discord-muted hover:bg-white/8'
                          )}
                        >
                          <div className="text-3xl mb-1">{opt.value === 'high' ? '📈' : '📉'}</div>
                          <span className="text-sm">{opt.label}</span>
                          <div className="text-xs text-discord-success mt-1">{opt.desc}</div>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {/* Roulette choice */}
              {currentGameType === 'roulette' && (
                <div className="flex flex-col items-center gap-6">
                   <div className={clsx(
                     "w-32 h-32 rounded-full border-8 border-zinc-900 bg-zinc-800 flex items-center justify-center text-4xl shadow-2xl relative",
                     spinning && "animate-spin"
                   )}>
                      <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-full" />
                      {spinning ? '🎡' : '🎰'}
                   </div>
                   <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        onClick={() => setGuess('red')}
                        className={clsx('p-4 rounded-2xl border transition-all duration-200 text-center font-bold',
                          guess === 'red' ? 'bg-red-500/20 border-red-500 text-white' : 'bg-white/4 border-white/8 text-discord-muted hover:bg-white/8')}
                      >
                        <div className="text-3xl mb-1">🔴</div>
                        <span className="text-sm">Rouge</span>
                        <div className="text-xs text-discord-success mt-1">× 1.9</div>
                      </button>
                      <button
                        onClick={() => setGuess('black')}
                        className={clsx('p-4 rounded-2xl border transition-all duration-200 text-center font-bold',
                          guess === 'black' ? 'bg-zinc-800/40 border-zinc-700 text-white' : 'bg-white/4 border-white/8 text-discord-muted hover:bg-white/8')}
                      >
                        <div className="text-3xl mb-1">⚫</div>
                        <span className="text-sm">Noir</span>
                        <div className="text-xs text-discord-success mt-1">× 1.9</div>
                      </button>
                   </div>
                </div>
              )}

              {/* Blackjack */}
              {currentGameType === 'blackjack' && (
                <div className="p-6 bg-white/3 border border-dashed border-white/10 rounded-2xl text-center">
                  <div className="text-4xl mb-2">🃏</div>
                  <p className="text-sm text-discord-muted">Battez le croupier pour un paiement × 2.0. Un Blackjack naturel paie × 2.5 !</p>
                </div>
              )}

              {/* Bet amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-discord-muted uppercase tracking-widest">Montant de la mise</p>
                  <span className="text-xs text-discord-muted">{selectedGame.min_bet}€ — {selectedGame.max_bet}€</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder={`Ex: ${selectedGame.min_bet}`}
                    className="glass-input pr-24"
                    value={bet}
                    min={selectedGame.min_bet}
                    max={Math.min(selectedGame.max_bet, profile?.balance || 0)}
                    onChange={e => setBet(e.target.value)}
                    disabled={spinning}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    {[selectedGame.min_bet, Math.floor(selectedGame.max_bet / 2), selectedGame.max_bet].map(v => (
                      <button
                        key={v}
                        onClick={() => setBet(Math.min(v, profile?.balance || 0).toString())}
                        className="px-2 py-1 text-xs font-bold bg-white/8 hover:bg-discord-blurple/30 text-discord-muted hover:text-white rounded-lg transition-all"
                      >{v}€</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inline message (smaller) */}
              {message && (
                <div className={clsx(
                  'p-3 rounded-2xl text-sm font-bold flex items-center gap-3 animate-scaleIn border',
                  message.type === 'win'
                    ? 'bg-discord-success/10 text-discord-success border-discord-success/20'
                    : message.type === 'lose'
                      ? 'bg-discord-error/10 text-discord-error border-discord-error/20'
                      : 'bg-discord-warning/10 text-discord-warning border-discord-warning/20'
                )}>
                  {message.type === 'win' ? <Trophy className="w-5 h-5 flex-shrink-0" />
                    : message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      : <TrendingDown className="w-5 h-5 flex-shrink-0" />}
                  {message.text}
                </div>
              )}

              {/* Play button */}
              <button
                onClick={() => handlePlay(currentGameType)}
                disabled={spinning || !bet}
                className="btn btn-primary w-full py-4 text-base"
                id="casino-play-btn"
              >
                {spinning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    En cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {currentGameType === 'slots' ? 'Lancer les rouleaux' : 'Jouer'}
                  </>
                )}
              </button>

              {/* Slots odds */}
              {currentGameType === 'slots' && (
                <div className="mt-2 p-4 bg-white/3 border border-white/6 rounded-2xl">
                  <p className="text-xs font-black text-discord-muted uppercase tracking-widest mb-2">Gains potentiels</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white/4 rounded-xl"><div>🍒🍒🍒</div><div className="text-discord-success font-bold mt-1">× 10</div></div>
                    <div className="p-2 bg-white/4 rounded-xl"><div>💎💎💎</div><div className="text-discord-success font-bold mt-1">× 25</div></div>
                    <div className="p-2 bg-white/4 rounded-xl"><div>🎰🎰🎰</div><div className="text-yellow-400 font-bold mt-1">× 50 🏆</div></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
