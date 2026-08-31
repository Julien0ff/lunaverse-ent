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
      className="fixed inset-0 z-[9000] flex items-center justify-center cursor-pointer bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className={clsx(
        'flex flex-col items-center justify-center gap-6 p-12 rounded-[2rem] border-4 animate-scaleIn shadow-2xl',
        isWin
          ? 'bg-discord-success/15 border-discord-success/60 shadow-[0_0_50px_rgba(87,242,135,0.3)]'
          : 'bg-discord-error/15 border-discord-error/60 shadow-[0_0_50px_rgba(237,66,69,0.3)]'
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
  const { t } = useLanguage()
  const [games, setGames] = useState<CasinoGame[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<CasinoGame | null>(null)
  const [bet, setBet] = useState('')
  const [guess, setGuess] = useState('')
  const [message, setMessage] = useState<{ type: 'win' | 'lose' | 'error'; text: string } | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [slotResult, setSlotResult] = useState<string[]>(['🎰', '🎰', '🎰'])
  const [stats, setStats] = useState({ wins: 0, losses: 0, totalWon: 0 })
  const [statsLoaded, setStatsLoaded] = useState(false)
  const [overlayResult, setOverlayResult] = useState<'win' | 'lose' | null>(null)

  const messageTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const spinIntervalRef = useRef<ReturnType<typeof setInterval>>()
  const spinTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const unmountedRef = useRef(false)
  const winAudioRef = useRef<HTMLAudioElement | null>(null)
  const loseAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    unmountedRef.current = false
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

  useEffect(() => {
    if (statsLoaded) return
    fetch('/api/profile/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !unmountedRef.current) {
          setStats({
            wins: d.casinoWins ?? 0,
            losses: d.casinoLosses ?? 0,
            totalWon: (d.totalWon ?? 0) - (d.totalLost ?? 0),
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

          if (isWin) {
            setStats(s => ({ ...s, wins: s.wins + 1, totalWon: s.totalWon + (data.winAmount - betAmount) }))
          } else {
            setStats(s => ({ ...s, losses: s.losses + 1, totalWon: s.totalWon - betAmount }))
          }

          setOverlayResult(isWin ? 'win' : 'lose')
          try {
            if (isWin) winAudioRef.current?.play().catch(() => {})
            else loseAudioRef.current?.play().catch(() => {})
          } catch { }
          
          setSpinning(false)
          refreshProfile()
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
          {[1, 2].map(i => <div key={i} className="glass-card h-64 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container animate-fadeIn">
      <ResultOverlay result={overlayResult} onClose={() => setOverlayResult(null)} />

      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-widest uppercase">
              Luna <span className="text-yellow-500">Casino</span>
            </h1>
            <p className="text-discord-muted mt-2 text-sm uppercase tracking-[0.2em]">{t('casino_page.subtitle')} - Espace VIP</p>
          </div>
          
          <div className="hidden md:flex items-center gap-8 px-6 py-4 glass-card rounded-[24px]">
            <div className="text-center">
              <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">{t('casino_page.wins')}</p>
              <p className="text-xl font-bold text-white">{stats.wins}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">{t('casino_page.losses')}</p>
              <p className="text-xl font-bold text-white">{stats.losses}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] font-black text-discord-muted uppercase tracking-widest mb-1">{t('casino_page.net_gains')}</p>
              <p className={clsx('text-xl font-bold', stats.totalWon >= 0 ? 'text-discord-success' : 'text-discord-error')}>
                {stats.totalWon >= 0 ? '+' : ''}{stats.totalWon.toLocaleString()} €
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="px-5 py-2.5 glass-card flex items-center gap-3 rounded-full">
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
          <span className="text-xs font-black tracking-widest uppercase text-white">{t('casino_page.balance_label').replace('{amount}', (profile?.balance.toFixed(0) || '0'))}</span>
        </div>
        
        {(profile as any)?.dirty_balance > 0 && (
          <div className="px-5 py-2.5 bg-red-950/40 border border-red-500/30 flex items-center gap-3 rounded-full backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
            <span className="text-xs font-black tracking-widest uppercase text-red-400">{t('casino_page.dirty_money').replace('{amount}', (profile as any).dirty_balance.toFixed(0))}</span>
          </div>
        )}

        {(profile as any)?.casino_streak > 0 && (
          <div className={clsx(
            "px-5 py-2.5 flex items-center gap-3 transition-colors border rounded-full backdrop-blur-md font-black",
            (profile as any).casino_streak >= 3 
              ? "bg-yellow-900/30 border-yellow-500/50 text-yellow-400" 
              : "bg-white/5 border-white/10 text-discord-muted"
          )}>
            <Sparkles className="w-4 h-4" />
            <span className="text-xs tracking-widest uppercase">{t('casino_page.streak').replace('{count}', (profile as any).casino_streak.toString())}</span>
          </div>
        )}

        {(profile as any)?.casino_streak >= 3 && (
          <div className="px-5 py-2.5 bg-red-950/40 border border-red-500/50 flex items-center gap-3 text-red-500 rounded-full font-black backdrop-blur-md">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs tracking-widest uppercase">{t('casino_page.risk').replace('{amount}', ((profile as any).streak_accumulated_winnings?.toFixed(0) || '0'))}</span>
          </div>
        )}
      </div>

      {games.length === 0 ? (
        <div className="text-center py-32 glass-card">
          <h2 className="text-2xl font-black text-white mb-2 tracking-widest uppercase">{t('casino_page.no_games')}</h2>
          <p className="text-discord-muted uppercase font-bold tracking-widest text-xs">{t('casino_page.games_soon')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-3 space-y-4">
            <p className="text-xs font-black text-discord-muted uppercase tracking-[0.2em] mb-4 pl-2">Jeux disponibles</p>
            {games.map(game => (
              <button
                key={game.id}
                onClick={() => { setSelectedGame(game); setMessage(null); setGuess('') }}
                className={clsx(
                  'w-full text-left p-5 transition-all duration-300 rounded-[24px] border-2 relative',
                  selectedGame?.id === game.id
                    ? 'bg-white/10 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] text-white'
                    : 'glass-card border-transparent hover:border-white/20 text-discord-muted'
                )}
              >
                <div>
                  <p className="font-black tracking-widest uppercase text-sm">{game.name}</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] mt-2 opacity-60">LIMITE: {game.min_bet}€ - {game.max_bet}€</p>
                </div>
              </button>
            ))}
          </div>

          {selectedGame && (
            <div className="xl:col-span-9">
              <div className="glass-card p-8 md:p-12 min-h-[600px] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="mb-12 text-center relative z-10">
                  <h2 className="text-3xl font-black text-white uppercase tracking-[0.3em]">{selectedGame.name}</h2>
                  <p className="text-discord-muted font-bold text-sm mt-3 uppercase tracking-widest">{selectedGame.description}</p>
                </div>

                {currentGameType === 'slots' && (
                  <div className="relative py-12 px-8 bg-black/40 border border-white/10 rounded-[32px] mx-auto w-full max-w-xl mb-12 shadow-inner">
                    <div className="relative flex items-center justify-center gap-4 md:gap-8 z-10">
                      {slotResult.map((sym, i) => (
                        <div
                          key={i}
                          className={clsx(
                            'w-24 h-32 md:w-32 md:h-40 flex items-center justify-center text-6xl md:text-7xl bg-white/5 border-2 rounded-[24px] shadow-lg transition-all duration-300',
                            spinning ? 'border-yellow-500/50 shadow-yellow-500/20' : 'border-white/10'
                          )}
                        >
                          <span className={clsx(spinning && "opacity-50 blur-[2px]")}>{sym}</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-1 bg-yellow-500/50 shadow-[0_0_15px_#eab308] z-20 pointer-events-none rounded-full" />
                  </div>
                )}

                {currentGameType === 'coin' && (
                  <div className="flex flex-col items-center gap-10 mb-12 relative z-10">
                     <div className={clsx(
                       "w-32 h-32 rounded-full bg-white/5 border-4 border-yellow-500/50 flex items-center justify-center text-6xl shadow-[0_0_40px_rgba(234,179,8,0.2)] transition-all duration-700",
                       spinning && "animate-spin border-yellow-500 scale-110"
                     )}>
                       {spinning ? '🪙' : (slotResult[0] || '🪙')}
                     </div>
                     <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        {COIN_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setGuess(opt.value)}
                            className={clsx(
                              'p-6 rounded-[24px] border-2 transition-all duration-300 text-center uppercase tracking-widest text-xs font-black',
                              guess === opt.value
                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                                : 'bg-white/5 border-white/10 text-discord-muted hover:border-white/30 hover:text-white hover:bg-white/10'
                            )}
                          >
                            <span className="block mb-2 text-xl">{opt.label}</span>
                            <span className="text-[10px] text-discord-success">Gains × 1.9</span>
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {currentGameType === 'dice' && (
                  <div className="flex flex-col items-center gap-10 mb-12 relative z-10">
                     <div className={clsx(
                       "w-32 h-32 bg-white/5 border-4 border-discord-blurple/50 rounded-[32px] flex items-center justify-center text-7xl shadow-[0_0_40px_rgba(88,101,242,0.2)] transition-all duration-300",
                       spinning && "animate-pulse border-discord-blurple scale-110"
                     )}>
                       {spinning ? '🎲' : (slotResult[0] || '🎲')}
                     </div>
                     <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        {DICE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setGuess(opt.value)}
                            className={clsx(
                              'p-6 rounded-[24px] border-2 transition-all duration-300 text-center uppercase tracking-widest text-xs font-black',
                              guess === opt.value
                                ? 'bg-discord-blurple/20 border-discord-blurple text-discord-blurple'
                                : 'bg-white/5 border-white/10 text-discord-muted hover:border-white/30 hover:text-white hover:bg-white/10'
                            )}
                          >
                            <span className="block mb-2 text-lg">{opt.label}</span>
                            <span className="text-[10px] text-discord-success">Gains {opt.desc}</span>
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {currentGameType === 'roulette' && (
                  <div className="flex flex-col items-center gap-10 mb-12 relative z-10">
                     <div className={clsx(
                       "w-40 h-40 rounded-full border-4 border-white/20 bg-black/50 flex items-center justify-center text-5xl relative transition-all duration-1000 shadow-2xl",
                       spinning && "rotate-[720deg]"
                     )}>
                        <div className="absolute inset-4 border-4 border-dashed border-white/10 rounded-full" />
                        {spinning ? '🎡' : '🎰'}
                     </div>
                     <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        <button
                          onClick={() => setGuess('red')}
                          className={clsx('p-6 rounded-[24px] border-2 transition-all duration-300 text-center uppercase tracking-widest text-xs font-black',
                            guess === 'red' ? 'bg-discord-error/20 border-discord-error text-discord-error' : 'bg-white/5 border-white/10 text-discord-muted hover:border-discord-error/50 hover:bg-discord-error/10')}
                        >
                          <span className="block mb-2 text-xl text-discord-error">ROUGE</span>
                          <span className="text-[10px] text-discord-success">Gains × 1.9</span>
                        </button>
                        <button
                          onClick={() => setGuess('black')}
                          className={clsx('p-6 rounded-[24px] border-2 transition-all duration-300 text-center uppercase tracking-widest text-xs font-black',
                            guess === 'black' ? 'bg-black/80 border-white/50 text-white' : 'bg-white/5 border-white/10 text-discord-muted hover:border-white/50 hover:bg-black/50')}
                        >
                          <span className="block mb-2 text-xl text-white">NOIR</span>
                          <span className="text-[10px] text-discord-success">Gains × 1.9</span>
                        </button>
                     </div>
                  </div>
                )}

                {currentGameType === 'blackjack' && (
                  <div className="p-12 glass-card text-center mb-12 relative z-10">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-discord-muted">{t('casino_page.blackjack_desc')}</p>
                  </div>
                )}

                <div className="max-w-xl mx-auto w-full relative z-10 bg-black/40 p-6 md:p-8 rounded-[32px] border border-white/5">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-black text-discord-muted uppercase tracking-widest">{t('casino_page.bet_amount')}</label>
                      <span className="text-xs font-bold text-discord-success/80 font-mono bg-discord-success/10 px-3 py-1 rounded-full border border-discord-success/20">Limite: {selectedGame.min_bet}€ - {selectedGame.max_bet}€</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0"
                        className="glass-input w-full px-6 py-6 text-center font-mono text-3xl font-black focus:border-yellow-500 transition-colors shadow-inner rounded-[24px]"
                        value={bet}
                        min={selectedGame.min_bet}
                        max={Math.min(selectedGame.max_bet, profile?.balance || 0)}
                        onChange={e => setBet(e.target.value)}
                        disabled={spinning}
                      />
                      <div className="flex justify-center gap-3 mt-4">
                        {[selectedGame.min_bet, Math.floor(selectedGame.max_bet / 2), selectedGame.max_bet].map(v => (
                          <button
                            key={v}
                            onClick={() => setBet(Math.min(v, profile?.balance || 0).toString())}
                            className="flex-1 py-3 text-xs font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 text-discord-muted hover:text-white transition-colors rounded-xl border border-white/5"
                          >{v}€</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {message && (
                    <div className={clsx(
                      'p-4 rounded-xl text-sm font-black tracking-widest uppercase text-center mb-6 flex items-center justify-center gap-3 animate-fadeIn border',
                      message.type === 'win'
                        ? 'bg-discord-success/10 text-discord-success border-discord-success/30'
                        : message.type === 'lose'
                          ? 'bg-discord-error/10 text-discord-error border-discord-error/30'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                    )}>
                      {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : null}
                      {message.text}
                    </div>
                  )}

                  <button
                    onClick={() => handlePlay(currentGameType)}
                    disabled={spinning || !bet}
                    className="w-full btn bg-white hover:bg-gray-200 text-black py-6 rounded-[24px] flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:shadow-none"
                    id="casino-play-btn"
                  >
                    <span className="font-black uppercase tracking-[0.2em] text-lg">
                      {spinning ? t('casino_page.spinning') : (currentGameType === 'slots' ? t('casino_page.spin_slots') : t('casino_page.play'))}
                    </span>
                  </button>
                </div>

                {currentGameType === 'slots' && (
                  <div className="mt-12 pt-8 border-t border-white/5 relative z-10">
                    <p className="text-xs font-black text-discord-muted uppercase tracking-widest mb-6 text-center">{t('casino_page.potential_wins')}</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="glass-card py-4 font-mono tracking-widest text-lg bg-black/40">🍒🍒🍒<br/><span className="text-yellow-500 font-black mt-2 block text-sm">× 10</span></div>
                      <div className="glass-card py-4 font-mono tracking-widest text-lg bg-black/40">💎💎💎<br/><span className="text-yellow-500 font-black mt-2 block text-sm">× 25</span></div>
                      <div className="glass-card py-4 font-mono tracking-widest text-lg bg-black/40 border-yellow-500/30">🎰🎰🎰<br/><span className="text-yellow-500 font-black mt-2 block text-sm">× 50</span></div>
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
