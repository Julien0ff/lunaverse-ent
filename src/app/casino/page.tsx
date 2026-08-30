'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
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
          Click to continue
        </div>
      </div>
    </div>
  )
}

export default function CasinoPage() {
  const { profile, refreshProfile } = useAuth()
  const { t } = useLanguage()
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

    if (isNaN(betAmount) || betAmount <= 0) { showMessage('error', t('casino_page.invalid_amount')); return }
    if (betAmount < selectedGame.min_bet || betAmount > selectedGame.max_bet) {
      showMessage('error', t('casino_page.bet_range').replace('{min}', selectedGame.min_bet.toString()).replace('{max}', selectedGame.max_bet.toString())); return
    }
    if (profile.balance < betAmount) { showMessage('error', t('casino_page.insufficient')); return }
    if ((gameType === 'coin' || gameType === 'dice') && !guess) {
      showMessage('error', t('casino_page.choose_bet')); return
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
    <div className="page-container font-sans bg-black min-h-screen relative text-zinc-300">
      {/* Big win/lose overlay */}
      <ResultOverlay result={overlayResult} onClose={() => setOverlayResult(null)} />

      {/* Header */}
      <div className="animate-fadeIn relative z-10 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-widest uppercase">
              Luna <span className="font-bold text-yellow-600">Casino</span>
            </h1>
            <p className="text-zinc-500 mt-2 text-sm uppercase tracking-[0.2em]">{t('casino_page.subtitle')} - Espace Privilège</p>
          </div>
          {/* Session stats */}
          <div className="hidden md:flex items-center gap-8 px-6 py-4 bg-zinc-900/50 rounded-none border border-white/5">
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('casino_page.wins')}</p>
              <p className="text-xl font-light text-white">{stats.wins}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('casino_page.losses')}</p>
              <p className="text-xl font-light text-white">{stats.losses}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{t('casino_page.net_gains')}</p>
              <p className={clsx('text-xl font-light', stats.totalWon >= 0 ? 'text-yellow-600' : 'text-red-500/80')}>
                {stats.totalWon >= 0 ? '+' : ''}{stats.totalWon.toLocaleString()} €
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance pills */}
      <div className="flex flex-wrap items-center gap-4 mb-8 animate-fadeIn">
        <div className="px-5 py-2.5 bg-zinc-900/80 border border-white/10 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-xs tracking-widest uppercase text-white font-medium">{t('casino_page.balance_label').replace('{amount}', (profile?.balance.toFixed(0) || '0'))}</span>
        </div>
        
        {(profile as any)?.dirty_balance > 0 && (
          <div className="px-5 py-2.5 bg-zinc-900/80 border border-red-900/30 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span className="text-xs tracking-widest uppercase text-zinc-400">{t('casino_page.dirty_money').replace('{amount}', (profile as any).dirty_balance.toFixed(0))}</span>
          </div>
        )}

        {(profile as any)?.casino_streak > 0 && (
          <div className={clsx(
            "px-5 py-2.5 flex items-center gap-3 transition-colors border",
            (profile as any).casino_streak >= 3 
              ? "bg-yellow-900/10 border-yellow-700/50 text-yellow-600" 
              : "bg-zinc-900/80 border-white/10 text-zinc-400"
          )}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs tracking-widest uppercase font-medium">{t('casino_page.streak').replace('{count}', (profile as any).casino_streak.toString())}</span>
          </div>
        )}

        {(profile as any)?.casino_streak >= 3 && (
          <div className="px-5 py-2.5 bg-red-950/20 border border-red-900/50 flex items-center gap-3 text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs tracking-widest uppercase font-medium">{t('casino_page.risk').replace('{amount}', ((profile as any).streak_accumulated_winnings?.toFixed(0) || '0'))}</span>
          </div>
        )}
      </div>

      {/* No games fallback */}
      {games.length === 0 ? (
        <div className="text-center py-32 border border-white/5 bg-zinc-900/30">
          <h2 className="text-2xl font-light text-white mb-2 tracking-widest uppercase">{t('casino_page.no_games')}</h2>
          <p className="text-zinc-500 uppercase tracking-widest text-xs">{t('casino_page.games_soon')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Game selector */}
          <div className="lg:col-span-4 space-y-4 relative z-10">
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-4">Sélection du jeu</p>
            {games.map(game => (
              <button
                key={game.id}
                onClick={() => { setSelectedGame(game); setMessage(null); setGuess('') }}
                className={clsx(
                  'w-full text-left p-6 transition-all duration-500 relative flex items-center justify-between border-l-2',
                  selectedGame?.id === game.id
                    ? 'bg-zinc-900 border-yellow-600'
                    : 'bg-zinc-950 border-transparent hover:bg-zinc-900/50 hover:border-white/20 text-zinc-500'
                )}
              >
                <div>
                  <p className={clsx("font-medium tracking-widest uppercase text-sm", selectedGame?.id === game.id ? "text-white" : "text-inherit")}>{game.name}</p>
                  <p className="text-[10px] font-normal tracking-[0.2em] mt-2 opacity-60">LIMITE: {game.min_bet}€ - {game.max_bet}€</p>
                </div>
                {selectedGame?.id === game.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
                )}
              </button>
            ))}
          </div>

          {/* Main game area */}
          {selectedGame && (
            <div className="lg:col-span-8 relative z-10">
              <div className="bg-zinc-950 border border-white/10 p-10 h-full flex flex-col justify-between">
                
                <div className="mb-12 text-center">
                  <h2 className="text-2xl font-light text-white uppercase tracking-[0.3em]">{selectedGame.name}</h2>
                  <p className="text-zinc-500 text-xs mt-3 uppercase tracking-widest">{selectedGame.description}</p>
                </div>

              {/* Slots reels */}
              {currentGameType === 'slots' && (
                <div className="relative py-12 px-6 bg-black border border-white/5 mx-auto max-w-lg mb-12">
                  <div className="relative flex items-center justify-center gap-6 z-10">
                    {slotResult.map((sym, i) => (
                      <div
                        key={i}
                        className={clsx(
                          'w-24 h-32 flex items-center justify-center text-5xl bg-zinc-900 border transition-all duration-300',
                          spinning ? 'border-yellow-600/50' : 'border-white/10'
                        )}
                      >
                        <span className={clsx(spinning && "opacity-50 blur-[1px]")}>{sym}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px bg-yellow-600/30 z-20 pointer-events-none" />
                </div>
              )}

              {/* Coin flip visual */}
              {currentGameType === 'coin' && (
                <div className="flex flex-col items-center gap-10 mb-12">
                   <div className={clsx(
                     "w-28 h-28 rounded-full bg-zinc-900 border border-yellow-600/30 flex items-center justify-center text-4xl transition-all duration-700",
                     spinning && "animate-spin border-yellow-600 scale-110"
                   )}>
                     {spinning ? '🪙' : (slotResult[0] || '🪙')}
                   </div>
                   <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      {COIN_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setGuess(opt.value)}
                          className={clsx(
                            'p-6 border transition-all duration-300 text-center uppercase tracking-widest text-xs',
                            guess === opt.value
                              ? 'bg-zinc-900 border-yellow-600 text-white'
                              : 'bg-black border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-300'
                          )}
                        >
                          <span className="block mb-2">{opt.label}</span>
                          <span className="text-[10px] text-yellow-600/60">× 1.9</span>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {/* Dice choice */}
              {currentGameType === 'dice' && (
                <div className="flex flex-col items-center gap-10 mb-12">
                   <div className={clsx(
                     "w-28 h-28 bg-zinc-900 border border-white/20 flex items-center justify-center text-5xl transition-all duration-300",
                     spinning && "animate-pulse border-white/50"
                   )}>
                     {spinning ? '🎲' : (slotResult[0] || '🎲')}
                   </div>
                   <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      {DICE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setGuess(opt.value)}
                          className={clsx(
                            'p-6 border transition-all duration-300 text-center uppercase tracking-widest text-xs',
                            guess === opt.value
                              ? 'bg-zinc-900 border-yellow-600 text-white'
                              : 'bg-black border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-300'
                          )}
                        >
                          <span className="block mb-2">{opt.label}</span>
                          <span className="text-[10px] text-yellow-600/60">{opt.desc}</span>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {/* Roulette choice */}
              {currentGameType === 'roulette' && (
                <div className="flex flex-col items-center gap-10 mb-12">
                   <div className={clsx(
                     "w-32 h-32 rounded-full border border-white/20 bg-zinc-900 flex items-center justify-center text-3xl relative transition-all duration-1000",
                     spinning && "rotate-[720deg]"
                   )}>
                      <div className="absolute inset-4 border border-dashed border-white/10 rounded-full" />
                      {spinning ? '🎡' : '🎰'}
                   </div>
                   <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                      <button
                        onClick={() => setGuess('red')}
                        className={clsx('p-6 border transition-all duration-300 text-center uppercase tracking-widest text-xs',
                          guess === 'red' ? 'bg-red-950/40 border-red-800 text-white' : 'bg-black border-white/10 text-zinc-500 hover:border-white/30')}
                      >
                        <span className="block mb-2 text-red-500 font-bold">ROUGE</span>
                        <span className="text-[10px] text-red-400/60">× 1.9</span>
                      </button>
                      <button
                        onClick={() => setGuess('black')}
                        className={clsx('p-6 border transition-all duration-300 text-center uppercase tracking-widest text-xs',
                          guess === 'black' ? 'bg-zinc-800 border-zinc-500 text-white' : 'bg-black border-white/10 text-zinc-500 hover:border-white/30')}
                      >
                        <span className="block mb-2 text-zinc-300 font-bold">NOIR</span>
                        <span className="text-[10px] text-zinc-400/60">× 1.9</span>
                      </button>
                   </div>
                </div>
              )}

              {/* Blackjack */}
              {currentGameType === 'blackjack' && (
                <div className="p-12 bg-black border border-white/5 text-center mb-12">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{t('casino_page.blackjack_desc')}</p>
                </div>
              )}

              {/* Inputs and Actions */}
              <div className="max-w-md mx-auto w-full">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{t('casino_page.bet_amount')}</p>
                    <span className="text-[10px] text-zinc-600 font-mono">{selectedGame.min_bet}€ — {selectedGame.max_bet}€</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-black border border-white/10 text-white px-4 py-4 text-center font-mono text-lg focus:outline-none focus:border-yellow-600 transition-colors"
                      value={bet}
                      min={selectedGame.min_bet}
                      max={Math.min(selectedGame.max_bet, profile?.balance || 0)}
                      onChange={e => setBet(e.target.value)}
                      disabled={spinning}
                    />
                    <div className="flex justify-center gap-2 mt-4">
                      {[selectedGame.min_bet, Math.floor(selectedGame.max_bet / 2), selectedGame.max_bet].map(v => (
                        <button
                          key={v}
                          onClick={() => setBet(Math.min(v, profile?.balance || 0).toString())}
                          className="px-4 py-2 text-[10px] tracking-widest uppercase bg-zinc-900 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >{v}€</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inline message */}
                {message && (
                  <div className={clsx(
                    'p-4 text-xs tracking-widest uppercase text-center mb-6 flex items-center justify-center gap-3 animate-fadeIn border',
                    message.type === 'win'
                      ? 'bg-green-950/30 text-green-500 border-green-900/50'
                      : message.type === 'lose'
                        ? 'bg-red-950/30 text-red-500 border-red-900/50'
                        : 'bg-yellow-950/30 text-yellow-600 border-yellow-900/50'
                  )}>
                    {message.text}
                  </div>
                )}

                {/* Play button */}
                <button
                  onClick={() => handlePlay(currentGameType)}
                  disabled={spinning || !bet}
                  className="w-full bg-white hover:bg-zinc-200 text-black py-5 flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
                  id="casino-play-btn"
                >
                  <span className="font-bold uppercase tracking-[0.2em] text-sm">
                    {spinning ? t('casino_page.spinning') : (currentGameType === 'slots' ? t('casino_page.spin_slots') : t('casino_page.play'))}
                  </span>
                </button>
              </div>

              {/* Slots odds */}
              {currentGameType === 'slots' && (
                <div className="mt-12 pt-8 border-t border-white/5">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-4 text-center">{t('casino_page.potential_wins')}</p>
                  <div className="grid grid-cols-3 gap-4 text-center text-xs">
                    <div className="text-zinc-400 font-mono tracking-widest">🍒🍒🍒<br/><span className="text-yellow-600/80 mt-2 block">× 10</span></div>
                    <div className="text-zinc-400 font-mono tracking-widest">💎💎💎<br/><span className="text-yellow-600/80 mt-2 block">× 25</span></div>
                    <div className="text-zinc-400 font-mono tracking-widest">🎰🎰🎰<br/><span className="text-yellow-600 font-bold mt-2 block">× 50</span></div>
                  </div>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
