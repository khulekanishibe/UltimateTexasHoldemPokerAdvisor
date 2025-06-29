import React, { useState, useEffect } from "react";
import { Spade as Spades, TrendingUp, Calculator, Target } from "lucide-react";
import CardPicker, { Card } from "./components/CardPicker";
import { evaluateHand, formatCards } from "./components/HandEvaluator";
import { getPreflopAdvice, getPostflopAdvice, getAdviceStyle } from "./components/BetAdvisor";
import { monteCarloSimulation } from "./utils/monteCarlo";

interface SimulationResult {
  win: number;
  tie: number;
  lose: number;
}

export default function App() {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [advice, setAdvice] = useState<string>("Select your 2 hole cards to begin");

  // Get current hand description if enough cards are selected
  const handDescription = selectedCards.length >= 5 
    ? evaluateHand(selectedCards) 
    : selectedCards.length >= 2 
      ? "Select community cards to evaluate hand"
      : "Select hole cards first";

  // Update advice and run simulation when cards change
  useEffect(() => {
    if (selectedCards.length < 2) {
      setAdvice("Select your 2 hole cards to begin");
      setSimulationResult(null);
      return;
    }

    if (selectedCards.length === 2) {
      // Pre-flop advice only
      setAdvice(getPreflopAdvice(selectedCards));
      setSimulationResult(null);
      return;
    }

    if (selectedCards.length < 5) {
      // Still need more community cards
      setAdvice("Add more community cards for post-flop analysis");
      setSimulationResult(null);
      return;
    }

    // Run Monte Carlo simulation for post-flop advice
    setIsSimulating(true);
    setAdvice("🎲 Running simulation...");
    
    monteCarloSimulation(selectedCards, 1000)
      .then((result) => {
        setSimulationResult(result);
        setAdvice(getPostflopAdvice(result.win));
      })
      .catch((error) => {
        console.error("Simulation error:", error);
        setAdvice("Error running simulation. Please try again.");
      })
      .finally(() => {
        setIsSimulating(false);
      });
  }, [selectedCards]);

  // Progress bar component
  const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="font-bold">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Spades className="h-8 w-8 text-green-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Ultimate Texas Hold'em Advisor
            </h1>
            <Target className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-center text-gray-400 mt-2">
            Make smart betting decisions with Monte Carlo simulation
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Card Picker */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-green-400" />
            <h2 className="text-xl font-semibold">Select Your Cards</h2>
          </div>
          <CardPicker onSelect={setSelectedCards} />
        </div>

        {/* Results Panel */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Hand Information */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Spades className="h-5 w-5 text-green-400" />
              Hand Analysis
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Selected Cards</p>
                <p className="font-mono text-lg">
                  {selectedCards.length > 0 ? formatCards(selectedCards) : "None selected"}
                </p>
              </div>

              {selectedCards.length >= 2 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Hole Cards</p>
                  <p className="font-mono text-lg text-blue-400">
                    {formatCards(selectedCards.slice(0, 2))}
                  </p>
                </div>
              )}

              {selectedCards.length > 2 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Community Cards</p>
                  <p className="font-mono text-lg text-green-400">
                    {formatCards(selectedCards.slice(2))}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-400 mb-1">Best Hand</p>
                <p className="font-semibold text-lg text-yellow-400">
                  {handDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Simulation Results */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Monte Carlo Simulation
            </h3>

            {isSimulating && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                <span className="ml-3 text-gray-400">Running 1000 simulations...</span>
              </div>
            )}

            {simulationResult && !isSimulating && (
              <div className="space-y-4">
                <ProgressBar 
                  label="Win Probability" 
                  value={simulationResult.win} 
                  color="bg-green-600" 
                />
                <ProgressBar 
                  label="Tie Probability" 
                  value={simulationResult.tie} 
                  color="bg-yellow-600" 
                />
                <ProgressBar 
                  label="Lose Probability" 
                  value={simulationResult.lose} 
                  color="bg-red-600" 
                />
                
                <div className="pt-2 text-sm text-gray-400">
                  Based on 1,000 random simulations
                </div>
              </div>
            )}

            {!simulationResult && !isSimulating && selectedCards.length < 5 && (
              <div className="text-center py-8 text-gray-500">
                Select at least 5 cards to run simulation
              </div>
            )}
          </div>
        </div>

        {/* Betting Advice */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-400" />
            Betting Advice
          </h3>
          
          <div className={`p-4 rounded-lg border-2 ${getAdviceStyle(advice)}`}>
            <p className="text-xl font-bold text-center">
              {advice}
            </p>
          </div>

          {selectedCards.length >= 2 && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Strategy Notes:</p>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Pre-flop: Bet 4x with pairs, A-x suited, or Broadway cards</li>
                <li>• Post-flop: Bet 4x with 60%+ win rate, 2x with 40-60%</li>
                <li>• Consider folding with less than 30% win probability</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500">
          <p>Ultimate Texas Hold'em Advisor • Built with React + TypeScript + Monte Carlo Simulation</p>
          <p className="text-sm mt-2">
            For entertainment purposes only. Gamble responsibly. 🎲
          </p>
        </div>
      </footer>
    </div>
  );
}