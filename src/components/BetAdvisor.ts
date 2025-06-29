/**
 * Betting advice system for Ultimate Texas Hold'em.
 * Provides strategic recommendations based on pre-flop hand strength
 * and post-flop Monte Carlo simulation results.
 */

/**
 * Pre-flop betting advice based on hole cards strength.
 * Uses standard Ultimate Texas Hold'em strategy:
 * - Bet 4x with strong hands (pairs, A-x suited, Broadway cards)
 * - Bet 2x with decent hands
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
      return "💪 Bet 2x - Strong Broadway cards";
    }
  }

  // K-x suited
  if ((rank1 === 'K' || rank2 === 'K') && suited) {
    return "💪 Bet 2x - King suited has potential";
  }

  // Q-x suited (Q-6 or better)
  if ((rank1 === 'Q' || rank2 === 'Q') && suited) {
    const otherRank = rank1 === 'Q' ? rank2 : rank1;
    const rankOrder = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
    if (rankOrder.indexOf(otherRank) >= 4) { // 6 or better
      return "💪 Bet 2x - Queen suited with decent kicker";
    }
  }

  // High offsuit hands
  if (ranks.includes('A') && ranks.includes('K')) {
    return "💪 Bet 2x - Ace-King offsuit is playable";
  }

  // Default: check and see the flop
  return "⏳ Check - See the flop before betting";
}

/**
 * Post-flop betting advice based on Monte Carlo win percentage.
 * Uses win rate thresholds to determine optimal betting strategy.
 * 
 * @param winPercent Win percentage from Monte Carlo simulation
 * @returns Betting advice string with reasoning
 */
export function getPostflopAdvice(winPercent: number): string {
  if (winPercent > 70) {
    return "🔥 Bet 4x - Excellent hand with high win rate!";
  } else if (winPercent > 60) {
    return "🔥 Bet 4x - Strong hand, bet for value!";
  } else if (winPercent > 50) {
    return "💪 Bet 2x - Good hand, moderate bet is wise";
  } else if (winPercent > 40) {
    return "⚖️ Bet 2x or Check - Marginal hand, proceed carefully";
  } else if (winPercent > 30) {
    return "⏳ Check - Weak hand, see if you improve";
  } else {
    return "❌ Consider Folding - Very weak hand";
  }
}

/**
 * Gets advice urgency level for UI styling.
 * 
 * @param advice Advice string
 * @returns CSS class string for styling
 */
export function getAdviceStyle(advice: string): string {
  if (advice.includes("Bet 4x")) {
    return "text-green-400 bg-green-900/20 border-green-500";
  } else if (advice.includes("Bet 2x")) {
    return "text-yellow-400 bg-yellow-900/20 border-yellow-500";
  } else if (advice.includes("Check")) {
    return "text-blue-400 bg-blue-900/20 border-blue-500";
  } else if (advice.includes("Fold")) {
    return "text-red-400 bg-red-900/20 border-red-500";
  } else {
    return "text-gray-400 bg-gray-900/20 border-gray-500";
  }
}