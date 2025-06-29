import { Hand } from "pokersolver";

/**
 * Monte Carlo Simulation Module for Ultimate Texas Hold'em
 * 
 * Runs statistical simulations to calculate win/tie/lose probabilities
 * by generating thousands of random scenarios and comparing final hands.
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
 * 
 * @returns Array of all 52 cards
 */
function generateDeck(): string[] {
  return allRanks.flatMap(r => allSuits.map(s => `${r}${s}`));
}

/**
 * Fisher-Yates shuffle algorithm for array randomization
 * Ensures uniform distribution of random outcomes
 * 
 * @param array Array to shuffle
 * @returns New shuffled array
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
 * Main Monte Carlo simulation for Ultimate Texas Hold'em.
 * 
 * Process:
 * 1. Remove known cards from deck
 * 2. For each iteration:
 *    - Generate random dealer hole cards
 *    - Fill community cards to 5 total
 *    - Evaluate best 5-card hands for player and dealer
 *    - Compare hands and record result
 * 3. Calculate percentages from all iterations
 * 
 * @param knownCards Array of known cards (player hole + community)
 * @param iterations Number of simulations to run (default: 1000)
 * @returns Promise resolving to simulation results
 */
export async function monteCarloSimulation(
  knownCards: string[],
  iterations: number = 1000
): Promise<SimulationResult> {
  
  // Validate input
  if (knownCards.length < 2) {
    throw new Error("Need at least 2 cards (hole cards) for simulation");
  }
  
  if (knownCards.length > 7) {
    throw new Error("Too many cards selected (max 7: 2 hole + 5 community)");
  }

  // Create deck without known cards
  const remainingDeck = generateDeck().filter(card => !knownCards.includes(card));
  
  if (remainingDeck.length < 7) {
    throw new Error("Not enough cards remaining in deck");
  }

  let wins = 0;
  let ties = 0;
  let losses = 0;
  let validIterations = 0;

  // Run Monte Carlo iterations
  for (let i = 0; i < iterations; i++) {
    try {
      // Shuffle remaining deck for this iteration
      const shuffled = shuffleArray(remainingDeck);
      
      // Extract player hole cards (first 2 of known cards)
      const playerHole = knownCards.slice(0, 2);
      
      // Generate dealer hole cards (first 2 from shuffled deck)
      const dealerHole = shuffled.slice(0, 2);
      
      // Determine community cards
      const existingCommunity = knownCards.slice(2); // Community cards already selected
      const communityNeeded = 5 - existingCommunity.length;
      
      // Fill community cards from shuffled deck (after dealer hole cards)
      const additionalCommunity = shuffled.slice(2, 2 + communityNeeded);
      const fullCommunity = [...existingCommunity, ...additionalCommunity];
      
      // Create final hands (best 5 from 7 cards)
      const playerCards = [...playerHole, ...fullCommunity];
      const dealerCards = [...dealerHole, ...fullCommunity];
      
      // Convert cards to pokersolver format (10 -> T)
      const playerSolverCards = playerCards.map(convertCardForSolver);
      const dealerSolverCards = dealerCards.map(convertCardForSolver);
      
      // Evaluate hands using pokersolver
      const playerHand = Hand.solve(playerSolverCards);
      const dealerHand = Hand.solve(dealerSolverCards);
      
      // Determine winner
      const winners = Hand.winners([playerHand, dealerHand]);
      
      if (winners.length === 2) {
        // Tie
        ties++;
      } else if (winners[0] === playerHand) {
        // Player wins
        wins++;
      } else {
        // Dealer wins
        losses++;
      }
      
      validIterations++;
      
    } catch (error) {
      console.warn(`Error in Monte Carlo iteration ${i}:`, error);
      // Skip this iteration on error but continue
      continue;
    }
  }

  // Ensure we have valid results
  if (validIterations === 0) {
    throw new Error("No valid iterations completed");
  }

  // Calculate percentages
  const total = validIterations;

  return {
    win: (wins / total) * 100,
    tie: (ties / total) * 100,
    lose: (losses / total) * 100,
    iterations: validIterations
  };
}

/**
 * Quick simulation with fewer iterations for faster results.
 * Useful for real-time updates during card selection.
 * 
 * @param knownCards Array of known cards
 * @param iterations Number of iterations (default: 300)
 * @returns Promise resolving to simulation results
 */
export async function quickSimulation(knownCards: string[], iterations: number = 300): Promise<SimulationResult> {
  return monteCarloSimulation(knownCards, iterations);
}