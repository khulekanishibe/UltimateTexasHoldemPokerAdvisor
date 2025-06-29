/**
 * Betting advice system for Ultimate Texas Hold'em.
 * Provides strategic recommendations based on game stage and hand strength.
 */

/**
 * Pre-flop betting advice based on hole cards strength.
 * Uses standard Ultimate Texas Hold'em strategy:
 * - Bet 4x with strong hands (pairs, A-x suited, Broadway cards)
 * - Check with marginal hands to see the flop
 * 
 * @param holeCards Array of exactly 2 hole cards
 * @returns Betting advice string
 */
export function getPreflopAdvice(holeCards: string[]): string {
  if (holeCards.length !== 2) {
    return "Select exactly 2 hole cards";
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

  // Any pair - bet 4x
  if (isPair) {
    return "🔥 Bet 4x - You have a pair!";
  }

  // A-x suited - bet 4x
  if ((rank1 === 'A' || rank2 === 'A') && suited) {
    return "🔥 Bet 4x - Ace suited is strong!";
  }

  // Both cards are Broadway (T, J, Q, K, A)
  if (strongRanks.includes(rank1) && strongRanks.includes(rank2)) {
    if (suited) {
      return "🔥 Bet 4x - Broadway suited is premium!";
    } else {
      return "🔥 Bet 4x - Strong Broadway cards";
    }
  }

  // K-x suited
  if ((rank1 === 'K' || rank2 === 'K') && suited) {
    return "🔥 Bet 4x - King suited has potential";
  }

  // Q-x suited (Q-6 or better)
  if ((rank1 === 'Q' || rank2 === 'Q') && suited) {
    const otherRank = rank1 === 'Q' ? rank2 : rank1;
    const rankOrder = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
    if (rankOrder.indexOf(otherRank) >= 4) { // 6 or better
      return "🔥 Bet 4x - Queen suited with decent kicker";
    }
  }

  // High offsuit hands
  if (ranks.includes('A') && ranks.includes('K')) {
    return "🔥 Bet 4x - Ace-King offsuit is playable";
  }

  // Default: check and see the flop
  return "⏳ Check - See the flop before betting";
}

/**
 * Flop betting advice based on Monte Carlo win percentage.
 * At the flop, players can bet 2x or check.
 * 
 * @param winPercent Win percentage from Monte Carlo simulation
 * @returns Betting advice string
 */
export function getFlopAdvice(winPercent: number): string {
  if (winPercent > 65) {
    return "🔥 Bet 2x - Excellent hand with high win rate!";
  } else if (winPercent > 50) {
    return "💪 Bet 2x - Good hand, bet for value!";
  } else if (winPercent > 35) {
    return "⚖️ Check - Marginal hand, see the turn";
  } else {
    return "⏳ Check - Weak hand, hope to improve";
  }
}

/**
 * Turn betting advice based on Monte Carlo win percentage.
 * At the turn, players can only check (no betting allowed).
 * 
 * @param winPercent Win percentage from Monte Carlo simulation
 * @returns Betting advice string
 */
export function getTurnAdvice(winPercent: number): string {
  if (winPercent > 60) {
    return "✅ Check - Strong hand, no betting allowed on turn";
  } else if (winPercent > 40) {
    return "⚖️ Check - Decent hand, see the river";
  } else {
    return "⏳ Check - Weak hand, hope for river improvement";
  }
}

/**
 * River betting advice based on Monte Carlo win percentage.
 * At the river, players can check or fold.
 * 
 * @param winPercent Win percentage from Monte Carlo simulation
 * @returns Betting advice string
 */
export function getRiverAdvice(winPercent: number): string {
  if (winPercent > 55) {
    return "✅ Check - Good hand, likely to win";
  } else if (winPercent > 35) {
    return "⚖️ Check - Marginal hand, but worth seeing showdown";
  } else {
    return "❌ Consider Folding - Very weak hand, likely to lose";
  }
}

/**
 * Gets advice urgency level for UI styling.
 * 
 * @param advice Advice string
 * @returns CSS class string for styling
 */
export function getAdviceStyle(advice: string): string {
  if (advice.includes("Bet 4x") || advice.includes("Bet 2x")) {
    return "text-green-400 bg-green-900/20 border-green-500";
  } else if (advice.includes("Check")) {
    return "text-blue-400 bg-blue-900/20 border-blue-500";
  } else if (advice.includes("Fold")) {
    return "text-red-400 bg-red-900/20 border-red-500";
  } else if (advice.includes("simulation")) {
    return "text-yellow-400 bg-yellow-900/20 border-yellow-500";
  } else {
    return "text-gray-400 bg-gray-900/20 border-gray-500";
  }
}