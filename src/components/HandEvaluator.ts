import { Hand } from "pokersolver";

/**
 * Hand Evaluator Module
 * 
 * Uses the 'pokersolver' library to evaluate poker hands and provide
 * hand rankings, descriptions, and formatting utilities.
 */

/**
 * Convert card format from "10h" to "Th" for pokersolver compatibility
 */
function convertCardForSolver(card: string): string {
  return card.replace('10', 'T');
}

/**
 * Evaluates the best 5-card poker hand from given cards using pokersolver library.
 * 
 * @param cards Array of card strings (e.g., ['Ah','Kd','Qs','Jc','10s'])
 * @returns Hand description string like "Straight", "Two Pair", "Full House", etc.
 */
export function evaluateHand(cards: string[]): string {
  if (cards.length < 5) {
    return "Need at least 5 cards to evaluate hand";
  }
  
  try {
    // Convert cards to pokersolver format (10 -> T)
    const solverCards = cards.map(convertCardForSolver);
    const result = Hand.solve(solverCards);
    return result.descr || "Unknown hand";
  } catch (error) {
    console.error("Error evaluating hand:", error);
    return "Error evaluating hand";
  }
}

/**
 * Gets the rank value of a poker hand for comparison purposes.
 * Higher numbers indicate stronger hands.
 * 
 * Hand Rankings (from pokersolver):
 * 1 = High Card
 * 2 = One Pair  
 * 3 = Two Pair
 * 4 = Three of a Kind
 * 5 = Straight
 * 6 = Flush
 * 7 = Full House
 * 8 = Four of a Kind
 * 9 = Straight Flush
 * 10 = Royal Flush
 * 
 * @param cards Array of card strings
 * @returns Numeric rank (higher = better hand)
 */
export function getHandRank(cards: string[]): number {
  if (cards.length < 5) return 0;
  
  try {
    const solverCards = cards.map(convertCardForSolver);
    const result = Hand.solve(solverCards);
    return result.rank || 0;
  } catch (error) {
    console.error("Error getting hand rank:", error);
    return 0;
  }
}

/**
 * Formats card array for display with suit symbols and proper rank display.
 * 
 * @param cards Array of card strings
 * @returns Formatted string with suit symbols
 */
export function formatCards(cards: string[]): string {
  const suitSymbols = { h: '♥', d: '♦', s: '♠', c: '♣' };
  
  return cards.map(card => {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    const symbol = suitSymbols[suit as keyof typeof suitSymbols] || suit;
    return `${rank}${symbol}`;
  }).join(' ');
}

/**
 * Determines if a hand is considered "premium" for pre-flop play
 * 
 * @param holeCards Array of exactly 2 hole cards
 * @returns Boolean indicating if hand is premium
 */
export function isPremiumHand(holeCards: string[]): boolean {
  if (holeCards.length !== 2) return false;
  
  const [card1, card2] = holeCards;
  const rank1 = card1.slice(0, -1);
  const suit1 = card1.slice(-1);
  const rank2 = card2.slice(0, -1);
  const suit2 = card2.slice(-1);
  
  const suited = suit1 === suit2;
  const isPair = rank1 === rank2;
  const strongRanks = ['A', 'K', 'Q', 'J', '10'];
  
  // Any pair is premium
  if (isPair) return true;
  
  // Suited Ace is premium
  if ((rank1 === 'A' || rank2 === 'A') && suited) return true;
  
  // Suited Broadway cards are premium
  if (strongRanks.includes(rank1) && strongRanks.includes(rank2) && suited) return true;
  
  // AK offsuit is premium
  if ((rank1 === 'A' && rank2 === 'K') || (rank1 === 'K' && rank2 === 'A')) return true;
  
  return false;
}

/**
 * Get detailed hand analysis for AI prompts
 * 
 * @param cards Array of card strings
 * @returns Detailed hand analysis object
 */
export function getHandAnalysis(cards: string[]) {
  if (cards.length < 5) {
    return {
      handName: "Incomplete hand",
      handRank: 0,
      strength: "unknown"
    };
  }

  try {
    const solverCards = cards.map(convertCardForSolver);
    const result = Hand.solve(solverCards);
    
    const handRank = result.rank || 0;
    let strength = "weak";
    
    if (handRank >= 8) strength = "very strong";
    else if (handRank >= 6) strength = "strong";
    else if (handRank >= 4) strength = "moderate";
    else if (handRank >= 2) strength = "weak";
    
    return {
      handName: result.descr || "Unknown hand",
      handRank,
      strength,
      cards: result.cards || []
    };
  } catch (error) {
    console.error("Error analyzing hand:", error);
    return {
      handName: "Error analyzing hand",
      handRank: 0,
      strength: "unknown"
    };
  }
}