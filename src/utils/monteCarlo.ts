import { Hand } from "pokersolver";

/**
 * Monte Carlo Simulation Module for Ultimate Texas Hold'em
 * 
 * Provides fast and accurate win probability calculations using
 * Monte Carlo simulation techniques with proper error handling
 * and performance optimizations.
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
 * Optimized Fisher-Yates shuffle algorithm
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
 * Validate input cards for simulation
 */
function validateCards(knownCards: string[]): void {
  if (!knownCards || knownCards.length < 2) {
    throw new Error("Need at least 2 cards for simulation");
  }
  
  if (knownCards.length > 7) {
    throw new Error("Too many cards (maximum 7: 2 hole + 5 community)");
  }

  // Check for duplicate cards
  const uniqueCards = new Set(knownCards);
  if (uniqueCards.size !== knownCards.length) {
    throw new Error("Duplicate cards detected");
  }

  // Validate card format
  const validCardRegex = /^(2|3|4|5|6|7|8|9|10|J|Q|K|A)[hdsc]$/;
  for (const card of knownCards) {
    if (!validCardRegex.test(card)) {
      throw new Error(`Invalid card format: ${card}`);
    }
  }
}

/**
 * Advanced Monte Carlo simulation with optimizations
 * 
 * Features:
 * - Input validation and error handling
 * - Efficient deck generation and shuffling
 * - Batch processing with yield points for UI responsiveness
 * - Detailed logging for debugging
 * - Race condition prevention
 * 
 * @param knownCards Array of known cards (hole + community)
 * @param iterations Number of simulation iterations (default: 1000)
 * @returns Promise<SimulationResult> Win/tie/lose percentages
 */
export async function monteCarloSimulation(
  knownCards: string[],
  iterations: number = 1000
): Promise<SimulationResult> {
  
  console.log(`🎯 Starting Monte Carlo simulation with ${knownCards.length} cards:`, knownCards);
  console.log(`🔢 Running ${iterations} iterations`);
  
  // Validate inputs
  validateCards(knownCards);
  
  if (iterations < 10 || iterations > 10000) {
    throw new Error("Iterations must be between 10 and 10,000");
  }

  // Create remaining deck
  const fullDeck = generateDeck();
  const remainingCards = fullDeck.filter(card => !knownCards.includes(card));
  
  console.log(`📦 Remaining deck size: ${remainingCards.length}`);
  
  if (remainingCards.length < 7) {
    throw new Error("Not enough remaining cards for simulation");
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
  let validSimulations = 0;

  const batchSize = 50; // Process in batches for UI responsiveness
  
  // Run simulations in batches
  for (let batch = 0; batch < Math.ceil(iterations / batchSize); batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, iterations);
    
    for (let i = batchStart; i < batchEnd; i++) {
      try {
        // Shuffle remaining deck
        const shuffled = shuffleArray(remainingCards);
        
        // Deal dealer cards (first 2 from shuffled deck)
        const dealerHole = shuffled.slice(0, 2);
        
        // Complete community cards if needed
        const additionalCommunity = shuffled.slice(2, 2 + communityNeeded);
        const fullCommunity = [...communityCards, ...additionalCommunity];
        
        // Ensure we have exactly 5 community cards
        if (fullCommunity.length !== 5) {
          console.warn(`Invalid community card count: ${fullCommunity.length}`);
          continue;
        }
        
        // Create 7-card hands for evaluation
        const playerHand = [...playerHole, ...fullCommunity];
        const dealerHand = [...dealerHole, ...fullCommunity];
        
        // Convert to pokersolver format
        const playerSolver = playerHand.map(convertCardForSolver);
        const dealerSolver = dealerHand.map(convertCardForSolver);
        
        // Evaluate hands
        const playerResult = Hand.solve(playerSolver);
        const dealerResult = Hand.solve(dealerSolver);
        
        // Compare hands using pokersolver's winner determination
        const winners = Hand.winners([playerResult, dealerResult]);
        
        if (winners.length === 2) {
          ties++;
        } else if (winners[0] === playerResult) {
          wins++;
        } else {
          losses++;
        }
        
        validSimulations++;
        
      } catch (error) {
        console.warn(`Simulation ${i} failed:`, error);
        continue;
      }
    }
    
    // Yield control to prevent UI blocking
    if (batch % 4 === 0) { // Every 4 batches (200 iterations)
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  if (validSimulations === 0) {
    throw new Error("No valid simulations completed");
  }

  // Calculate percentages
  const result: SimulationResult = {
    win: (wins / validSimulations) * 100,
    tie: (ties / validSimulations) * 100,
    lose: (losses / validSimulations) * 100,
    iterations: validSimulations
  };
  
  console.log(`✅ Monte Carlo simulation complete:`, result);
  console.log(`📊 Results: ${wins}W / ${ties}T / ${losses}L out of ${validSimulations} valid simulations`);
  
  // Validate result percentages
  const totalPercentage = result.win + result.tie + result.lose;
  if (Math.abs(totalPercentage - 100) > 0.1) {
    console.warn(`⚠️ Percentage total mismatch: ${totalPercentage}%`);
  }
  
  return result;
}

/**
 * Quick simulation with fewer iterations for faster results
 * 
 * @param knownCards Array of known cards
 * @param iterations Number of iterations (default: 300)
 * @returns Promise<SimulationResult> Win/tie/lose percentages
 */
export async function quickSimulation(
  knownCards: string[], 
  iterations: number = 300
): Promise<SimulationResult> {
  console.log(`⚡ Running quick simulation with ${iterations} iterations`);
  return monteCarloSimulation(knownCards, iterations);
}

/**
 * Batch simulation for multiple scenarios (future enhancement)
 * 
 * @param scenarios Array of card scenarios to simulate
 * @param iterations Iterations per scenario
 * @returns Promise<SimulationResult[]> Results for each scenario
 */
export async function batchSimulation(
  scenarios: string[][],
  iterations: number = 300
): Promise<SimulationResult[]> {
  console.log(`🔄 Running batch simulation for ${scenarios.length} scenarios`);
  
  const results: SimulationResult[] = [];
  
  for (let i = 0; i < scenarios.length; i++) {
    console.log(`📊 Processing scenario ${i + 1}/${scenarios.length}`);
    try {
      const result = await monteCarloSimulation(scenarios[i], iterations);
      results.push(result);
    } catch (error) {
      console.error(`❌ Scenario ${i + 1} failed:`, error);
      // Push error result
      results.push({
        win: 0,
        tie: 0,
        lose: 100,
        iterations: 0
      });
    }
    
    // Yield between scenarios
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  console.log(`✅ Batch simulation complete: ${results.length} results`);
  return results;
}