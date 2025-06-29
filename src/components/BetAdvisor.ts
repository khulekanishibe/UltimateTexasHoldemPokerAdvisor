/**
 * Betting Advice System for Ultimate Texas Hold'em
 * 
 * Provides strategic recommendations based on:
 * - Pre-flop hand strength (2 hole cards)
 * - Post-flop Monte Carlo simulation results (5+ cards)
 * - Game stage and betting rules
 */

/**
 * Game stages in Ultimate Texas Hold'em
 */
export type GameStage = 'preflop' | 'flop' | 'turn' | 'river';

/**
 * Betting advice with confidence level
 */
export interface BettingAdvice {
  action: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  stage: GameStage;
}

/**
 * Pre-flop betting advice based on hole cards strength.
 * 
 * Ultimate Texas Hold'em Pre-flop Strategy:
 * - Bet 4x with premium hands (pairs, A-x suited, Broadway cards)
 * - Bet 2x with playable hands
 * - Check/Fold with marginal hands
 * 
 * @param holeCards Array of exactly 2 hole cards
 * @returns Betting advice object
 */
export function getPreflopAdvice(holeCards: string[]): BettingAdvice {
  if (holeCards.length !== 2) {
    return {
      action: "Select exactly 2 hole cards",
      confidence: 'low',
      reasoning: "Need hole cards to analyze",
      stage: 'preflop'
    };
  }

  const [card1, card2] = holeCards;
  const rank1 = card1.slice(0, -1);
  const suit1 = card1.slice(-1);
  const rank2 = card2.slice(0, -1);
  const suit2 = card2.slice(-1);

  const suited = suit1 === suit2;
  const ranks = [rank1, rank2].sort();
  const strongRanks = ['A', 'K', 'Q', 'J', '10'];
  const isPair = rank1 === rank2;

  // Pocket Aces - Premium hand
  if (isPair && rank1 === 'A') {
    return {
      action: "🔥 Pocket Rockets — Max it! (4x Bet)",
      confidence: 'high',
      reasoning: "Pocket Aces are the strongest starting hand",
      stage: 'preflop'
    };
  }

  // Any other pair - bet 4x
  if (isPair) {
    const pairName = rank1 === 'K' ? 'Kings' : 
                    rank1 === 'Q' ? 'Queens' : 
                    rank1 === 'J' ? 'Jacks' : 
                    rank1 === '10' ? 'Tens' : `${rank1}s`;
    return {
      action: "🚀 4x Bet (Pair)",
      confidence: 'high',
      reasoning: `Pocket ${pairName} are strong pre-flop`,
      stage: 'preflop'
    };
  }

  // A-x suited - bet 4x
  if ((rank1 === 'A' || rank2 === 'A') && suited) {
    return {
      action: "🚀 4x Bet (Suited Ace)",
      confidence: 'high',
      reasoning: "Suited Ace has excellent potential",
      stage: 'preflop'
    };
  }

  // Both cards are Broadway (10, J, Q, K, A)
  if (strongRanks.includes(rank1) && strongRanks.includes(rank2)) {
    if (suited) {
      return {
        action: "🚀 4x Bet (Strong Combo)",
        confidence: 'high',
        reasoning: "Suited high cards are premium",
        stage: 'preflop'
      };
    } else {
      // AK offsuit is still strong
      if (ranks.includes('A') && ranks.includes('K')) {
        return {
          action: "🚀 4x Bet (Big Slick)",
          confidence: 'high',
          reasoning: "AK offsuit is a premium hand",
          stage: 'preflop'
        };
      }
      return {
        action: "💪 2x Bet (Playable)",
        confidence: 'medium',
        reasoning: "Strong cards but wait for better spot",
        stage: 'preflop'
      };
    }
  }

  // K-x suited or Q-x suited (decent kicker)
  if (((rank1 === 'K' || rank2 === 'K') || (rank1 === 'Q' || rank2 === 'Q')) && suited) {
    const otherRank = rank1 === 'K' || rank1 === 'Q' ? rank2 : rank1;
    const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    if (rankOrder.indexOf(otherRank) >= 4) { // 6 or better
      return {
        action: "💪 2x Bet (Playable)",
        confidence: 'medium',
        reasoning: "Decent suited hand with potential",
        stage: 'preflop'
      };
    }
  }

  // Trash hands
  const isTrash = (ranks.includes('2') || ranks.includes('3')) && 
                  !suited && 
                  !strongRanks.some(r => ranks.includes(r));
  
  if (isTrash) {
    return {
      action: "🛑 Check or Fold",
      confidence: 'high',
      reasoning: "Very weak starting hand",
      stage: 'preflop'
    };
  }

  // Default: check
  return {
    action: "🤔 Check or Fold",
    confidence: 'medium',
    reasoning: "Marginal hand, wait for more information",
    stage: 'preflop'
  };
}

/**
 * Post-flop betting advice based on Monte Carlo win percentage.
 * 
 * Ultimate Texas Hold'em Post-flop Strategy:
 * - Bet 3x with strong hands (65%+ win rate)
 * - Bet 2x with decent hands (45-65% win rate)  
 * - Check with marginal hands (35-45% win rate)
 * - Fold with very weak hands (<35% win rate)
 * 
 * @param winPercent Win percentage from Monte Carlo simulation
 * @param stage Current game stage
 * @returns Betting advice object
 */
export function getPostflopAdvice(winPercent: number, stage: GameStage = 'flop'): BettingAdvice {
  console.log(`🎯 Getting postflop advice: ${winPercent.toFixed(1)}% win rate, stage: ${stage}`);
  
  // Validate input
  if (typeof winPercent !== 'number' || isNaN(winPercent)) {
    console.error('❌ Invalid win percentage:', winPercent);
    return {
      action: "⚠️ Error: Invalid win percentage",
      confidence: 'low',
      reasoning: "Simulation returned invalid data",
      stage
    };
  }

  // Very strong hands (70%+ win rate) - Bet 3x
  if (winPercent >= 70) {
    console.log('✅ Very strong hand detected - recommending 3x bet');
    return {
      action: "🚀 Bet 3x (Excellent Hand!)",
      confidence: 'high',
      reasoning: `${winPercent.toFixed(1)}% win rate is excellent - maximize value`,
      stage
    };
  }
  
  // Strong hands (55-70% win rate) - Bet 3x
  if (winPercent >= 55) {
    console.log('✅ Strong hand detected - recommending 3x bet');
    return {
      action: "🚀 Bet 3x (Strong Position)",
      confidence: 'high',
      reasoning: `${winPercent.toFixed(1)}% win rate gives you a strong edge`,
      stage
    };
  }
  
  // Good hands (45-55% win rate) - Bet 2x
  if (winPercent >= 45) {
    console.log('✅ Good hand detected - recommending 2x bet');
    return {
      action: "💪 Bet 2x (Favorable Odds)",
      confidence: 'high',
      reasoning: `${winPercent.toFixed(1)}% win rate gives you an edge`,
      stage
    };
  }
  
  // Marginal hands (35-45% win rate) - Check
  if (winPercent >= 35) {
    console.log('⚠️ Marginal hand detected - recommending check');
    return {
      action: "🤔 Check (Marginal Hand)",
      confidence: 'medium',
      reasoning: `${winPercent.toFixed(1)}% win rate - see more cards for free`,
      stage
    };
  }
  
  // Weak hands (<35% win rate) - Fold
  console.log('❌ Weak hand detected - recommending fold');
  return {
    action: "🛑 Fold (Too Risky)",
    confidence: 'high',
    reasoning: `${winPercent.toFixed(1)}% win rate is too low to continue`,
    stage
  };
}

/**
 * Gets the current game stage based on number of selected cards
 * 
 * @param cardCount Number of selected cards
 * @returns Current game stage
 */
export function getGameStage(cardCount: number): GameStage {
  if (cardCount <= 2) return 'preflop';
  if (cardCount <= 5) return 'flop';
  if (cardCount === 6) return 'turn';
  return 'river';
}

/**
 * Gets contextual tip message based on game stage
 * 
 * @param stage Current game stage
 * @param cardCount Number of selected cards
 * @returns Tip message string
 */
export function getTipMessage(stage: GameStage, cardCount: number): string {
  switch (stage) {
    case 'preflop':
      if (cardCount === 0) return "🃏 Select your 2 hole cards to begin analysis";
      if (cardCount === 1) return "🃏 Select your second hole card to complete your starting hand";
      return "🃏 Pre-flop analysis complete — add community cards to continue";
    
    case 'flop':
      if (cardCount === 3) return "🎯 Add the flop (3 community cards) to see your hand potential";
      if (cardCount === 4) return "🎯 Add one more flop card to complete the flop analysis";
      return "🎯 Flop analysis running — calculating your winning odds";
    
    case 'turn':
      return "🎲 Turn card added — this is where the action intensifies";
    
    case 'river':
      return "🏁 River card — final decision time with complete information";
    
    default:
      return "🃏 Select cards to get started with professional poker analysis";
  }
}