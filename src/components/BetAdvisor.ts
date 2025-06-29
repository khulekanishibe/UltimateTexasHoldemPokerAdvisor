/**
 * Betting Advice System for Ultimate Texas Hold'em
 * 
 * Provides strategic recommendations based on:
 * - Pre-flop hand strength (2 hole cards)
 * - Post-flop Monte Carlo simulation results (5+ cards)
 * - Game stage and betting rules
 */

import type { Card } from './CardPicker';

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
 * - Check with marginal hands to see the flop
 * 
 * @param holeCards Array of exactly 2 hole cards
 * @returns Betting advice object
 */
export function getPreflopAdvice(holeCards: Card[]): BettingAdvice {
  if (holeCards.length !== 2) {
    return {
      action: "Select exactly 2 hole cards",
      confidence: 'low',
      reasoning: "Need hole cards to analyze",
      stage: 'preflop'
    };
  }

  const [card1, card2] = holeCards;
  const rank1 = card1[0];
  const suit1 = card1[1];
  const rank2 = card2[0];
  const suit2 = card2[1];

  const suited = suit1 === suit2;
  const ranks = [rank1, rank2].sort();
  const strongRanks = ['A', 'K', 'Q', 'J', 'T'];
  const isPair = rank1 === rank2;

  // Pocket Aces - Premium hand
  if (isPair && rank1 === 'A') {
    return {
      action: "🚀 Bet 4x - Pocket Rockets!",
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
                    rank1 === 'T' ? 'Tens' : `${rank1}s`;
    return {
      action: "🔥 Bet 4x - Pocket Pair!",
      confidence: 'high',
      reasoning: `Pocket ${pairName} are strong pre-flop`,
      stage: 'preflop'
    };
  }

  // A-x suited - bet 4x
  if ((rank1 === 'A' || rank2 === 'A') && suited) {
    return {
      action: "🔥 Bet 4x - Suited Ace!",
      confidence: 'high',
      reasoning: "Suited Ace has excellent potential",
      stage: 'preflop'
    };
  }

  // Both cards are Broadway (T, J, Q, K, A)
  if (strongRanks.includes(rank1) && strongRanks.includes(rank2)) {
    if (suited) {
      return {
        action: "🔥 Bet 4x - Suited Broadway!",
        confidence: 'high',
        reasoning: "Suited high cards are premium",
        stage: 'preflop'
      };
    } else {
      // AK offsuit is still strong
      if (ranks.includes('A') && ranks.includes('K')) {
        return {
          action: "💪 Bet 4x - Big Slick!",
          confidence: 'high',
          reasoning: "AK offsuit is a premium hand",
          stage: 'preflop'
        };
      }
      return {
        action: "💪 Check - See the flop",
        confidence: 'medium',
        reasoning: "Strong cards but wait for flop",
        stage: 'preflop'
      };
    }
  }

  // K-x suited
  if ((rank1 === 'K' || rank2 === 'K') && suited) {
    return {
      action: "💪 Check - King suited",
      confidence: 'medium',
      reasoning: "Decent hand, see what flop brings",
      stage: 'preflop'
    };
  }

  // Q-x suited (Q-6 or better)
  if ((rank1 === 'Q' || rank2 === 'Q') && suited) {
    const otherRank = rank1 === 'Q' ? rank2 : rank1;
    const rankOrder = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
    if (rankOrder.indexOf(otherRank) >= 4) { // 6 or better
      return {
        action: "💪 Check - Queen suited",
        confidence: 'medium',
        reasoning: "Queen with decent kicker",
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
      action: "❌ Fold - Trash hand",
      confidence: 'high',
      reasoning: "Very weak starting hand",
      stage: 'preflop'
    };
  }

  // Default: check and see the flop
  return {
    action: "⏳ Check - See the flop",
    confidence: 'medium',
    reasoning: "Marginal hand, wait for more information",
    stage: 'preflop'
  };
}

/**
 * Post-flop betting advice based on Monte Carlo win percentage.
 * 
 * Ultimate Texas Hold'em Post-flop Strategy:
 * - Bet 3x with strong hands (60%+ win rate)
 * - Check or bet 2x with decent hands (40-60% win rate)
 * - Fold with very weak hands (<30% win rate)
 * 
 * @param winPercent Win percentage from Monte Carlo simulation
 * @param stage Current game stage
 * @returns Betting advice object
 */
export function getPostflopAdvice(winPercent: number, stage: GameStage = 'flop'): BettingAdvice {
  if (winPercent > 75) {
    return {
      action: "🚀 Bet 3x - Monster hand!",
      confidence: 'high',
      reasoning: `${winPercent.toFixed(1)}% win rate is excellent`,
      stage
    };
  } else if (winPercent > 60) {
    return {
      action: "🔥 Bet 3x - Strong position!",
      confidence: 'high',
      reasoning: `${winPercent.toFixed(1)}% win rate justifies aggressive betting`,
      stage
    };
  } else if (winPercent > 50) {
    return {
      action: "💪 Check or Bet 2x - Good hand",
      confidence: 'medium',
      reasoning: `${winPercent.toFixed(1)}% win rate is above average`,
      stage
    };
  } else if (winPercent > 40) {
    return {
      action: "⚖️ Check - Marginal hand",
      confidence: 'medium',
      reasoning: `${winPercent.toFixed(1)}% win rate is borderline`,
      stage
    };
  } else if (winPercent > 30) {
    return {
      action: "⏳ Check - Weak hand",
      confidence: 'low',
      reasoning: `${winPercent.toFixed(1)}% win rate is concerning`,
      stage
    };
  } else {
    return {
      action: "❌ Fold - Very weak",
      confidence: 'high',
      reasoning: `${winPercent.toFixed(1)}% win rate is too low`,
      stage
    };
  }
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
 * Gets advice urgency level for UI styling based on action type
 * 
 * @param advice Betting advice object
 * @returns CSS class string for styling
 */
export function getAdviceStyle(advice: BettingAdvice): string {
  const action = advice.action.toLowerCase();
  
  if (action.includes("bet 4x") || action.includes("bet 3x")) {
    return "text-green-400 bg-green-900/20 border-green-500";
  } else if (action.includes("bet 2x")) {
    return "text-yellow-400 bg-yellow-900/20 border-yellow-500";
  } else if (action.includes("check")) {
    return "text-blue-400 bg-blue-900/20 border-blue-500";
  } else if (action.includes("fold")) {
    return "text-red-400 bg-red-900/20 border-red-500";
  } else {
    return "text-gray-400 bg-gray-900/20 border-gray-500";
  }
}

/**
 * Gets contextual tip message based on game stage
 * 
 * @param stage Current game stage
 * @param cardCount Number of selected cards
 * @returns Tip message string
 */
export function getStageTip(stage: GameStage, cardCount: number): string {
  switch (stage) {
    case 'preflop':
      if (cardCount === 0) return "🃏 Select your 2 hole cards to begin analysis";
      if (cardCount === 1) return "🃏 Select your second hole card";
      return "🃏 Pre-flop analysis complete - add flop cards next";
    
    case 'flop':
      if (cardCount === 3) return "🎯 Flop time — let's see what connects!";
      if (cardCount === 4) return "🎯 Add one more flop card to complete the flop";
      return "🎯 Flop analysis running — checking your odds";
    
    case 'turn':
      return "🎲 Turn card added — one more to go!";
    
    case 'river':
      return "🏁 River is decision time — final odds calculated";
    
    default:
      return "🃏 Select cards to get started";
  }
}