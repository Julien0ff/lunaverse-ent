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

    // House edge logic
    const luckyRoll = Math.random() < 0.65
    let rawResult: any = {}

    if (game_type === 'slots') {
      const symbols = ['🍒', '🍋', '🍇', '💎', '⭐', '🎰']
      const weights = [35, 30, 20, 10, 4, 1]
      const spin = () => {
        let r = Math.random() * weights.reduce((a, b) => a + b, 0)
        for (let i = 0; i < symbols.length; i++) { r -= weights[i]; if (r <= 0) return symbols[i] }
        return symbols[symbols.length - 1]
      }
      const reels = [spin(), spin(), spin()]
      
      // Override if forced loss
      if (!luckyRoll) {
        reels[0] = '🍒'; reels[1] = '🍋'; reels[2] = '🍇';
      }

      const unique = Array.from(new Set(reels))
      if (unique.length === 1) {
        isWin = true
        if (reels[0] === '🎰') winAmount = Math.floor(bet * 50)
        else if (reels[0] === '💎') winAmount = Math.floor(bet * 25)
        else if (reels[0] === '⭐') winAmount = Math.floor(bet * 15)
        else winAmount = Math.floor(bet * 10)
      } else if (luckyRoll) {
        isWin = true; winAmount = Math.floor(bet * 2)
      } else {
        isWin = false
      }
      result = reels.join(' ')
      rawResult = { reels }
    } else if (game_type === 'dice') {
      const roll = Math.floor(Math.random() * 100) + 1
      isWin = (guess === 'high' && roll > 50) || (guess === 'low' && roll <= 50)
      
      if (!luckyRoll && isWin) {
        // Force loss
        isWin = false
      } else if (luckyRoll && !isWin) {
        // Force win
        isWin = true
      }
      
      const finalRoll = isWin 
        ? (guess === 'high' ? Math.floor(Math.random() * 50) + 51 : Math.floor(Math.random() * 50) + 1)
        : (guess === 'high' ? Math.floor(Math.random() * 50) + 1 : Math.floor(Math.random() * 50) + 51)
        
      winAmount = isWin ? Math.floor(bet * 1.8) : 0
      result = `Dé: ${finalRoll}`
      rawResult = { roll: finalRoll }
    } else if (game_type === 'coin') {
      isWin = luckyRoll
      const outcome = isWin ? guess : (guess === 'heads' ? 'tails' : 'heads')
      winAmount = isWin ? Math.floor(bet * 1.9) : 0
      result = outcome === 'heads' ? 'Pile' : 'Face'
      rawResult = { side: outcome }
    } else if (game_type === 'roulette') {
      // European Roulette: 0 to 36
      const winningNumber = Math.floor(Math.random() * 37)
      const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
      const isRed = reds.includes(winningNumber)
      const isBlack = winningNumber !== 0 && !isRed
      const isEven = winningNumber !== 0 && winningNumber % 2 === 0
      const isOdd = winningNumber !== 0 && winningNumber % 2 !== 0

      if (guess === 'red') isWin = isRed
      else if (guess === 'black') isWin = isBlack
      else if (guess === 'even') isWin = isEven
      else if (guess === 'odd') isWin = isOdd
      else if (!isNaN(parseInt(guess))) isWin = (parseInt(guess) === winningNumber)

      // Override based on house edge
      if (!luckyRoll && isWin) {
         isWin = false
         // Very hacky: just pick 0 if forced loss to ensure they lose
         rawResult = { number: 0, color: 'green' }
      } else {
         rawResult = { number: winningNumber, color: winningNumber === 0 ? 'green' : isRed ? 'red' : 'black' }
      }

      const mult = (!isNaN(parseInt(guess))) ? 35 : 2
      winAmount = isWin ? Math.floor(bet * mult) : 0
      result = `🎡 ${rawResult.number} (${rawResult.color === 'red' ? 'Rouge' : rawResult.color === 'black' ? 'Noir' : 'Vert'})`
    } else if (game_type === 'blackjack') {
      // One-shot Blackjack for simplicity but with real cards
      const suits = ['♠', '♥', '♦', '♣']
      const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
      const drawCard = () => {
        const r = ranks[Math.floor(Math.random() * ranks.length)]
        const s = suits[Math.floor(Math.random() * suits.length)]
        return { rank: r, suit: s }
      }
      
      const p1 = drawCard(); const p2 = drawCard()
      const d1 = drawCard(); const d2 = drawCard()

      const getVal = (c: any) => c.rank === 'A' ? 11 : (['J','Q','K'].includes(c.rank) ? 10 : parseInt(c.rank))
      const pScore = getVal(p1) + getVal(p2)
      const dScore = getVal(d1) + getVal(d2)

      isWin = luckyRoll ? (pScore > dScore || dScore > 21) : false
      if (!isWin && pScore >= dScore) {
         // Force loss
         isWin = false
      } else if (isWin && pScore <= dScore) {
         // Force win
         isWin = true
      }
      
      winAmount = isWin ? Math.floor(bet * 2) : 0
      result = isWin ? '🃏 Gagné' : '🃏 Perdu'
      rawResult = { 
        player: [p1, p2], playerScore: pScore,
        dealer: [d1, d2], dealerScore: dScore
      }
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
      result,
      rawResult
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
