import { Hand } from "pokersolver";
import type { Card } from "../components/CardPicker";

/**
 * Monte Carlo Simulation Module for Ultimate Texas Hold'em
 * 
 * Runs statistical simulations to calculate win/tie/lose probabilities
 * by generating thousands of random scenarios and comparing final hands.
 */

// All possible ranks and suits for deck generation
const allRanks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'] as const;
const allSuits = ['h','d','s','c'] as const;

/**
 * Monte Carlo simulation result interface
 */
export interface SimulationResult {
  win: number;
  tie: number;
  lose: number;
  iterations: number;
  confidence: number;
}

/**
 * Generate complete 52-card deck
 * 
 * @returns Array of all 52 cards
 */
function generateDeck(): Card[] {
  return allRanks.flatMap(r => allSuits.map(s => `${r}${s}` as Card));
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
 * Calculate confidence level based on number of iterations
 * More iterations = higher confidence in results
 * 
 * @param iterations Number of simulation iterations
 * @returns Confidence percentage (0-100)
 */
function calculateConfidence(iterations: number): number {
  if (iterations >= 2000) return 95;
  if (iterations >= 1000) return 90;
  if (iterations >= 500) return 85;
  if (iterations >= 250) return 80;
  return 75;
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
  knownCards: Card[],
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
      
      // Evaluate hands using pokersolver
      const playerHand = Hand.solve(playerCards);
      const dealerHand = Hand.solve(dealerCards);
      
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
  const confidence = calculateConfidence(validIterations);

  return {
    win: (wins / total) * 100,
    tie: (ties / total) * 100,
    lose: (losses / total) * 100,
    iterations: validIterations,
    confidence
  };
}

/**
 * Quick simulation with fewer iterations for faster results.
 * Useful for real-time updates during card selection.
 * 
 * @param knownCards Array of known cards
 * @returns Promise resolving to simulation results
 */
export async function quickSimulation(knownCards: Card[]): Promise<SimulationResult> {
  return monteCarloSimulation(knownCards, 500);
}

/**
 * Detailed simulation with more iterations for accurate results.
 * Use when precision is more important than speed.
 * 
 * @param knownCards Array of known cards
 * @returns Promise resolving to simulation results
 */
export async function detailedSimulation(knownCards: Card[]): Promise<SimulationResult> {
  return monteCarloSimulation(knownCards, 2000);
}

/**
 * Batch simulation runner that yields intermediate results
 * Useful for showing progress during long simulations
 * 
 * @param knownCards Array of known cards
 * @param totalIterations Total iterations to run
 * @param batchSize Number of iterations per batch
 * @param onProgress Callback for intermediate results
 * @returns Promise resolving to final simulation results
 */
export async function batchSimulation(
  knownCards: Card[],
  totalIterations: number = 2000,
  batchSize: number = 250,
  onProgress?: (result: SimulationResult, progress: number) => void
): Promise<SimulationResult> {
  
  let totalWins = 0;
  let totalTies = 0;
  let totalLosses = 0;
  let totalValidIterations = 0;
  
  const batches = Math.ceil(totalIterations / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const iterationsThisBatch = Math.min(batchSize, totalIterations - (batch * batchSize));
    
    try {
      const batchResult = await monteCarloSimulation(knownCards, iterationsThisBatch);
      
      // Accumulate results
      const batchWins = (batchResult.win / 100) * batchResult.iterations;
      const batchTies = (batchResult.tie / 100) * batchResult.iterations;
      const batchLosses = (batchResult.lose / 100) * batchResult.iterations;
      
      totalWins += batchWins;
      totalTies += batchTies;
      totalLosses += batchLosses;
      totalValidIterations += batchResult.iterations;
      
      // Calculate current overall percentages
      const currentResult: SimulationResult = {
        win: (totalWins / totalValidIterations) * 100,
        tie: (totalTies / totalValidIterations) * 100,
        lose: (totalLosses / totalValidIterations) * 100,
        iterations: totalValidIterations,
        confidence: calculateConfidence(totalValidIterations)
      };
      
      // Report progress
      if (onProgress) {
        const progress = ((batch + 1) / batches) * 100;
        onProgress(currentResult, progress);
      }
      
    } catch (error) {
      console.error(`Error in batch ${batch}:`, error);
      continue;
    }
  }
  
  if (totalValidIterations === 0) {
    throw new Error("No valid iterations completed in batch simulation");
  }
  
  return {
    win: (totalWins / totalValidIterations) * 100,
    tie: (totalTies / totalValidIterations) * 100,
    lose: (totalLosses / totalValidIterations) * 100,
    iterations: totalValidIterations,
    confidence: calculateConfidence(totalValidIterations)
  };
}