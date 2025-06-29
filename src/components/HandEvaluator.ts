import { Hand } from "pokersolver";

/**
 * Hand Evaluator Module
 * 
 * Uses the 'pokersolver' library to evaluate poker hands and provide
 * hand rankings, descriptions, and formatting utilities.
 */

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
    const result = Hand.solve(cards);
    return result.rank || 0;
  } catch (error) {
    console.error("Error getting hand rank:", error);
    return 0;
  }
}

/**
 * Gets detailed hand information including rank and qualifying cards
 * 
 * @param cards Array of card strings
 * @returns Object with hand details
 */
export function getHandDetails(cards: string[]): {
  rank: number;
  description: string;
  qualifiers: string[];
} {
  if (cards.length < 5) {
    return {
      rank: 0,
      description: "Insufficient cards",
      qualifiers: []
    };
  }
  
  try {
    const result = Hand.solve(cards);
    return {
      rank: result.rank || 0,
      description: result.descr || "Unknown hand",
      qualifiers: result.qualifiers || []
    };
  } catch (error) {
    console.error("Error getting hand details:", error);
    return {
      rank: 0,
      description: "Error evaluating hand",
      qualifiers: []
    };
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

/**
 * Formats cards for display with color coding
 * 
 * @param cards Array of card strings
 * @returns Array of formatted card objects with color information
 */
export function formatCardsWithColors(cards: string[]): Array<{
  display: string;
  isRed: boolean;
  original: string;
}> {
  const suitSymbols = { h: '♥', d: '♦', s: '♠', c: '♣' };
  
  return cards.map(card => {
    const rank = card[0] === 'T' ? '10' : card[0];
    const suit = card[1];
    const symbol = suitSymbols[suit as keyof typeof suitSymbols] || suit;
    const isRed = suit === 'h' || suit === 'd';
    
    return {
      display: `${rank}${symbol}`,
      isRed,
      original: card
    };
  });
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
  const rank1 = card1[0];
  const suit1 = card1[1];
  const rank2 = card2[0];
  const suit2 = card2[1];
  
  const suited = suit1 === suit2;
  const isPair = rank1 === rank2;
  const strongRanks = ['A', 'K', 'Q', 'J', 'T'];
  
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