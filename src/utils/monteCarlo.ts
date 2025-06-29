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
 * Process a single Monte Carlo iteration
 * Separated for better error handling and performance
 */
function processIteration(
  playerHole: string[],
  existingCommunity: string[],
  communityNeeded: number,
  shuffled: string[]
): { result: 'win' | 'tie' | 'lose' } | null {
  try {
    // Generate dealer hole cards (first 2 from shuffled deck)
    const dealerHole = shuffled.slice(0, 2);
    
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
      return { result: 'tie' };
    } else if (winners[0] === playerHand) {
      return { result: 'win' };
    } else {
      return { result: 'lose' };
    }
  } catch (error) {
    console.warn('Error in Monte Carlo iteration:', error);
    return null;
  }
}

/**
 * Process a batch of Monte Carlo iterations with proper async yielding
 */
async function processBatch(
  knownCards: string[],
  remainingDeck: string[],
  batchSize: number
): Promise<{ wins: number; ties: number; losses: number; processed: number }> {
  let wins = 0;
  let ties = 0;
  let losses = 0;
  let processed = 0;

  const playerHole = knownCards.slice(0, 2);
  const existingCommunity = knownCards.slice(2);
  const communityNeeded = 5 - existingCommunity.length;

  for (let i = 0; i < batchSize; i++) {
    // Shuffle remaining deck for this iteration
    const shuffled = shuffleArray(remainingDeck);
    
    const result = processIteration(playerHole, existingCommunity, communityNeeded, shuffled);
    
    if (result) {
      switch (result.result) {
        case 'win':
          wins++;
          break;
        case 'tie':
          ties++;
          break;
        case 'lose':
          losses++;
          break;
      }
      processed++;
    }

    // Yield control every 10 iterations to keep UI responsive
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return { wins, ties, losses, processed };
}

/**
 * Main Monte Carlo simulation for Ultimate Texas Hold'em.
 * 
 * Process:
 * 1. Remove known cards from deck
 * 2. Process iterations in small batches with async yielding
 * 3. Use proper error handling and validation
 * 4. Calculate percentages from all iterations
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
  if (!Array.isArray(knownCards) || knownCards.length < 2) {
    throw new Error("Need at least 2 cards (hole cards) for simulation");
  }
  
  if (knownCards.length > 7) {
    throw new Error("Too many cards selected (max 7: 2 hole + 5 community)");
  }

  // Validate card format
  const validCardRegex = /^(2|3|4|5|6|7|8|9|10|J|Q|K|A)[hdsc]$/;
  for (const card of knownCards) {
    if (!validCardRegex.test(card)) {
      throw new Error(`Invalid card format: ${card}`);
    }
  }

  // Check for duplicate cards
  const uniqueCards = new Set(knownCards);
  if (uniqueCards.size !== knownCards.length) {
    throw new Error("Duplicate cards detected");
  }

  // Create deck without known cards
  const fullDeck = generateDeck();
  const remainingDeck = fullDeck.filter(card => !knownCards.includes(card));
  
  if (remainingDeck.length < 7) {
    throw new Error("Not enough cards remaining in deck");
  }

  let totalWins = 0;
  let totalTies = 0;
  let totalLosses = 0;
  let totalProcessed = 0;

  // Process in small batches to keep UI responsive
  const batchSize = 25; // Smaller batches for better responsiveness
  const totalBatches = Math.ceil(iterations / batchSize);

  for (let batch = 0; batch < totalBatches; batch++) {
    const remainingIterations = iterations - (batch * batchSize);
    const currentBatchSize = Math.min(batchSize, remainingIterations);

    // Process this batch
    const batchResult = await processBatch(knownCards, remainingDeck, currentBatchSize);
    
    totalWins += batchResult.wins;
    totalTies += batchResult.ties;
    totalLosses += batchResult.losses;
    totalProcessed += batchResult.processed;

    // Yield control back to the browser between batches
    if (batch < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  // Ensure we have valid results
  if (totalProcessed === 0) {
    throw new Error("No valid iterations completed");
  }

  // Calculate percentages
  const total = totalProcessed;

  return {
    win: (totalWins / total) * 100,
    tie: (totalTies / total) * 100,
    lose: (totalLosses / total) * 100,
    iterations: totalProcessed
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