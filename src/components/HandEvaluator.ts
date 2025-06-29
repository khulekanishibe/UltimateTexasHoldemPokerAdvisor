import { Hand } from "pokersolver";

/**
 * Evaluates the best 5-card poker hand from given cards using pokersolver library.
 * 
 * @param cards Array of card strings (e.g., ['Ah','Kd','Qs','Jc','Ts'])
 * @returns Hand description string like "Straight", "Two Pair", "Full House", etc.
 */
export function evaluateHand(cards: string[]): string {
  if (cards.length < 5) {
    return "Need at least 5 cards to evaluate hand";
  }
  
  try {
    // pokersolver expects cards in format like "Ah", "Kd", etc.
    const result = Hand.solve(cards);
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
 * @param cards Array of card strings
 * @returns Numeric rank (higher = better hand)
 */
export function getHandRank(cards: string[]): number {
  if (cards.length < 5) return 0;
  
  try {
    const result = Hand.solve(cards);
    return result.rank || 0;
  } catch (error) {
    console.error("Error getting hand rank:", error);
    return 0;
  }
}

/**
 * Formats card array for display with suit symbols and proper rank display.
 * Converts 'T' to '10' for better readability.
 * 
 * @param cards Array of card strings
 * @returns Formatted string with suit symbols
 */
export function formatCards(cards: string[]): string {
  const suitSymbols = { h: '♥', d: '♦', s: '♠', c: '♣' };
  
  return cards.map(card => {
    const rank = card[0] === 'T' ? '10' : card[0]; // Convert T to 10 for display
    const suit = card[1];
    const symbol = suitSymbols[suit as keyof typeof suitSymbols] || suit;
    return `${rank}${symbol}`;
  }).join(' ');
}