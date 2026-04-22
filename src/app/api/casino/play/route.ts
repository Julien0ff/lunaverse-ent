import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { game_id, bet, game_type, guess } = body

    if (!game_id || !bet || !game_type) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const { data: game } = await supabase
      .from('casino_games').select('*').eq('id', game_id).single()

    if (!game) return NextResponse.json({ error: 'Jeu introuvable' }, { status: 404 })

    if (bet < game.min_bet || bet > game.max_bet) {
      return NextResponse.json({ error: `Mise entre ${game.min_bet}€ et ${game.max_bet}€` }, { status: 400 })
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    if (profile.balance < bet) return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

    let winAmount = 0
    let isWin = false
    let result = ''

    // House edge: 30% base win rate as requested
    const luckyRoll = Math.random() < 0.30

    if (luckyRoll) {
      if (game_type === 'slots') {
        const symbols = ['🍒', '🍋', '🍇', '💎', '⭐', '🎰']
        const weights = [35, 30, 20, 10, 4, 1]
        const spin = () => {
          let r = Math.random() * weights.reduce((a, b) => a + b, 0)
          for (let i = 0; i < symbols.length; i++) { r -= weights[i]; if (r <= 0) return symbols[i] }
          return symbols[symbols.length - 1]
        }
        const reels = [spin(), spin(), spin()]
        result = reels.join(' ')
        const unique = Array.from(new Set(reels))
        if (unique.length === 1) {
          isWin = true
          if (reels[0] === '🎰') winAmount = Math.floor(bet * 50)
          else if (reels[0] === '💎') winAmount = Math.floor(bet * 25)
          else if (reels[0] === '⭐') winAmount = Math.floor(bet * 15)
          else winAmount = Math.floor(bet * 10)
        } else {
          // If luckyRoll but no jackpot, give a small win
          isWin = true; winAmount = Math.floor(bet * 2)
          result = reels.join(' ')
        }
      } else if (game_type === 'dice') {
        isWin = true; winAmount = Math.floor(bet * 1.8)
        result = guess === 'high' ? `Dé: ${Math.floor(Math.random() * 49) + 51}` : `Dé: ${Math.floor(Math.random() * 50) + 1}`
      } else if (game_type === 'coin') {
        isWin = true; winAmount = Math.floor(bet * 1.9)
        result = guess === 'heads' ? 'Pile' : 'Face'
      } else if (game_type === 'roulette') {
        isWin = true; winAmount = Math.floor(bet * 1.9)
        result = guess === 'red' ? '🎡 7 (Rouge)' : '🎡 10 (Noir)'
      } else if (game_type === 'blackjack') {
        isWin = true; winAmount = Math.floor(bet * 2)
        result = '🃏 Gagné'
      }
    } else {
      // Forced loss
      isWin = false
      if (game_type === 'slots') result = '🍒 🍋 🍇'
      else if (game_type === 'dice') result = guess === 'high' ? `Dé: ${Math.floor(Math.random() * 50) + 1}` : `Dé: ${Math.floor(Math.random() * 49) + 51}`
      else if (game_type === 'coin') result = guess === 'heads' ? 'Face' : 'Pile'
      else if (game_type === 'roulette') result = guess === 'red' ? '🎡 10 (Noir)' : '🎡 7 (Rouge)'
      else if (game_type === 'blackjack') result = '🃏 Perdu (Bust)'
    }

    let streakMsg = ''
    let streakStatus = profile.casino_streak || 0
    let streakAccumulated = Number(profile.streak_accumulated_winnings || 0)
    let dirtyBalance = Number(profile.dirty_balance || 0)
    let mainBalance = Number(profile.balance || 0)

    if (isWin) {
      streakStatus++
      const netWin = winAmount - bet
      streakAccumulated += netWin
      dirtyBalance += winAmount
      mainBalance -= bet
      
      // 1. Record as laundering source
      try {
        await supabase.from('dirty_money_sources').insert([{
          user_id: profile.id,
          amount: winAmount,
          source: game.name || 'Casino',
          details: `${game_type} - Série de ${streakStatus}`,
          declared: false
        }])
      } catch (err) { console.error('Error recording source:', err) }

      // 2. Trigger Site Notification
      try {
        await supabase.from('notifications').insert([{
          user_id: profile.id,
          title: '💰 Jackpot au Casino !',
          message: `${winAmount}€ attendent d'être blanchis à la banque.`,
          type: 'money',
          link: '/bank'
        }])
      } catch (err) { console.error('Error sending notification:', err) }

      if (streakStatus >= 3) {
        streakMsg = ` 🔥 SÉRIE DE ${streakStatus} D'AFFILÉE ! Gain accumulé : ${streakAccumulated.toFixed(0)}€`
      }
    } else {
      mainBalance -= bet
      if (streakStatus >= 3) {
        streakMsg = ` 💀 SÉRIE BRISÉE ! Vous perdez les ${streakAccumulated.toFixed(0)}€ accumulés durant cette série.`
        dirtyBalance = Math.max(0, dirtyBalance - streakAccumulated)
      }
      streakStatus = 0
      streakAccumulated = 0
    }

    const { error: updateError } = await supabase.from('profiles').update({
      balance: mainBalance,
      dirty_balance: dirtyBalance,
      casino_streak: streakStatus,
      streak_accumulated_winnings: streakAccumulated
    }).eq('id', profile.id)

    if (updateError) throw updateError

    try {
      await supabase.from('casino_history').insert([{
        user_id: profile.id, game_id: game.id,
        bet_amount: bet, win_amount: winAmount, is_win: isWin
      }])
    } catch { }

    try {
      await supabase.from('transactions').insert([{
        from_user_id: profile.id,
        to_user_id: null,
        amount: -bet,
        type: 'casino',
        description: `${game.name} — ${isWin ? `Gagné ${winAmount}€ (Argent Sale)` : `Perdu ${bet}€`}`
      }])
    } catch { }

    const message = isWin
      ? `🎉 ${result} — Vous avez gagné ${winAmount}€ !${streakMsg}`
      : `😢 ${result} — Vous avez perdu ${bet}€.${streakMsg}`

    return NextResponse.json({ 
      success: true, 
      isWin, 
      winAmount, 
      newBalance: mainBalance, 
      dirtyBalance,
      streak: streakStatus,
      streakAccumulated,
      message, 
      result 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
