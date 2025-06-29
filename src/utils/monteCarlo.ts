import { Hand } from "pokersolver";

/**
 * Monte Carlo Simulation Module for Ultimate Texas Hold'em
 * 
 * Completely rewritten for reliability and performance.
 * Uses a simple, direct approach without complex async patterns.
 */

// All possible ranks and suits for deck generation
const allRanks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'] as const;
const allSuits = ['h','d','s','c'] as const;

/**
 * Monte Carlo simulation result interface
 */
export interface SimulationResult {
  win: number;
  tie: number;
  lose: number;
  iterations: number;
}

/**
 * Convert card format from "10h" to "Th" for pokersolver compatibility
 */
function convertCardForSolver(card: string): string {
  return card.replace('10', 'T');
}

/**
 * Generate complete 52-card deck
 */
function generateDeck(): string[] {
  return allRanks.flatMap(r => allSuits.map(s => `${r}${s}`));
}

/**
 * Simple Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Completely rewritten Monte Carlo simulation.
 * Simple, synchronous approach with minimal complexity.
 */
export async function monteCarloSimulation(
  knownCards: string[],
  iterations: number = 1000
): Promise<SimulationResult> {
  
  console.log(`🎯 Starting Monte Carlo with ${knownCards.length} cards:`, knownCards);
  
  // Basic validation
  if (!knownCards || knownCards.length < 2) {
    throw new Error("Need at least 2 cards");
  }
  
  if (knownCards.length > 7) {
    throw new Error("Too many cards (max 7)");
  }

  // Create remaining deck
  const fullDeck = generateDeck();
  const remainingCards = fullDeck.filter(card => !knownCards.includes(card));
  
  console.log(`📦 Remaining deck size: ${remainingCards.length}`);
  
  if (remainingCards.length < 7) {
    throw new Error("Not enough remaining cards");
  }

  // Extract known cards
  const playerHole = knownCards.slice(0, 2);
  const communityCards = knownCards.slice(2);
  const communityNeeded = Math.max(0, 5 - communityCards.length);
  
  console.log(`🃏 Player hole: ${playerHole.join(', ')}`);
  console.log(`🏘️ Community: ${communityCards.join(', ')} (need ${communityNeeded} more)`);

  let wins = 0;
  let ties = 0;
  let losses = 0;

  // Run simulations
  for (let i = 0; i < iterations; i++) {
    try {
      // Shuffle deck
      const shuffled = shuffleArray(remainingCards);
      
      // Deal dealer cards (first 2)
      const dealerHole = shuffled.slice(0, 2);
      
      // Complete community cards if needed
      const additionalCommunity = shuffled.slice(2, 2 + communityNeeded);
      const fullCommunity = [...communityCards, ...additionalCommunity];
      
      // Create 7-card hands
      const playerHand = [...playerHole, ...fullCommunity];
      const dealerHand = [...dealerHole, ...fullCommunity];
      
      // Convert to pokersolver format
      const playerSolver = playerHand.map(convertCardForSolver);
      const dealerSolver = dealerHand.map(convertCardForSolver);
      
      // Evaluate hands
      const playerResult = Hand.solve(playerSolver);
      const dealerResult = Hand.solve(dealerSolver);
      
      // Compare hands
      const winners = Hand.winners([playerResult, dealerResult]);
      
      if (winners.length === 2) {
        ties++;
      } else if (winners[0] === playerResult) {
        wins++;
      } else {
        losses++;
      }
      
    } catch (error) {
      console.warn(`Iteration ${i} failed:`, error);
      continue;
    }
    
    // Yield every 100 iterations
    if (i > 0 && i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  const total = wins + ties + losses;
  
  if (total === 0) {
    throw new Error("No valid simulations completed");
  }

  const result = {
    win: (wins / total) * 100,
    tie: (ties / total) * 100,
    lose: (losses / total) * 100,
    iterations: total
  };
  
  console.log(`✅ Simulation complete:`, result);
  
  return result;
}

/**
 * Quick simulation with fewer iterations
 */
export async function quickSimulation(knownCards: string[], iterations: number = 300): Promise<SimulationResult> {
  return monteCarloSimulation(knownCards, iterations);
}