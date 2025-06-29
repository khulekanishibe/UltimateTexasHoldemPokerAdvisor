import React, { useState, useEffect, useTransition } from "react";
import { Spade as Spades, TrendingUp, Calculator, Target, Zap } from "lucide-react";
import CardPicker, { Card } from "./components/CardPicker";
import { evaluateHand, formatCards, isPremiumHand } from "./components/HandEvaluator";
import { 
  getPreflopAdvice, 
  getPostflopAdvice, 
  getAdviceStyle, 
  getGameStage,
  getStageTip,
  type BettingAdvice 
} from "./components/BetAdvisor";
import { monteCarloSimulation, type SimulationResult } from "./utils/monteCarlo";

/**
 * Ultimate Texas Hold'em Poker Advisor
 * 
 * A comprehensive poker strategy tool that provides:
 * - Real-time betting advice based on hand strength
 * - Monte Carlo simulation for win probability analysis
 * - Stage-specific strategy recommendations
 * - Professional poker table UI/UX
 */
export default function App() {
  // Core state
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [advice, setAdvice] = useState<BettingAdvice>({
    action: "Select your 2 hole cards to begin",
    confidence: 'low',
    reasoning: "Need cards to analyze",
    stage: 'preflop'
  });

  // UI state
  const [isPending, startTransition] = useTransition();
  const [isSimulating, setIsSimulating] = useState(false);

  // Derived state
  const gameStage = getGameStage(selectedCards.length);
  const holeCards = selectedCards.slice(0, 2);
  const communityCards = selectedCards.slice(2);
  
  // Get current hand description if enough cards are selected
  const handDescription = selectedCards.length >= 5 
    ? evaluateHand(selectedCards) 
    : selectedCards.length >= 2 
      ? "Select community cards to evaluate hand"
      : "Select hole cards first";

  /**
   * Update advice and run simulation when cards change
   */
  useEffect(() => {
    if (selectedCards.length < 2) {
      setAdvice({
        action: "Select your 2 hole cards to begin",
        confidence: 'low',
        reasoning: "Need hole cards to analyze",
        stage: 'preflop'
      });
      setSimulationResult(null);
      return;
    }

    if (selectedCards.length === 2) {
      // Pre-flop advice only
      const preflopAdvice = getPreflopAdvice(holeCards);
      setAdvice(preflopAdvice);
      setSimulationResult(null);
      return;
    }

    if (selectedCards.length < 5) {
      // Still need more community cards
      setAdvice({
        action: "Add more community cards for analysis",
        confidence: 'low',
        reasoning: "Need at least 5 cards total",
        stage: gameStage
      });
      setSimulationResult(null);
      return;
    }

    // Run Monte Carlo simulation for post-flop advice
    setIsSimulating(true);
    setAdvice({
      action: "🎲 Running simulation...",
      confidence: 'medium',
      reasoning: "Calculating win probabilities",
      stage: gameStage
    });
    
    startTransition(() => {
      monteCarloSimulation(selectedCards, 1000)
        .then((result) => {
          setSimulationResult(result);
          const postflopAdvice = getPostflopAdvice(result.win, gameStage);
          setAdvice(postflopAdvice);
        })
        .catch((error) => {
          console.error("Simulation error:", error);
          setAdvice({
            action: "Error running simulation",
            confidence: 'low',
            reasoning: "Please try again",
            stage: gameStage
          });
        })
        .finally(() => {
          setIsSimulating(false);
        });
    });
  }, [selectedCards, gameStage, holeCards]);

  /**
   * Reset all state
   */
  const handleReset = () => {
    setSelectedCards([]);
    setSimulationResult(null);
    setAdvice({
      action: "Select your 2 hole cards to begin",
      confidence: 'low',
      reasoning: "Need cards to analyze",
      stage: 'preflop'
    });
  };

  /**
   * Progress bar component for simulation results
   */
  const ProgressBar = ({ 
    label, 
    value, 
    color, 
    icon 
  }: { 
    label: string; 
    value: number; 
    color: string;
    icon?: React.ReactNode;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-gray-300 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-bold text-white">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div 
          className={`h-4 rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-poker-feltDark to-poker-felt text-white">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Spades className="h-8 w-8 text-poker-gold" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-poker-gold to-poker-silver bg-clip-text text-transparent">
              Ultimate Texas Hold'em Advisor
            </h1>
            <Target className="h-8 w-8 text-poker-silver" />
          </div>
          <p className="text-center text-gray-400 mt-2">
            Professional poker strategy with Monte Carlo simulation
          </p>
        </div>
      </div>

      {/* Dynamic Tip Banner */}
      <div className="bg-yellow-100 text-yellow-900 text-sm rounded-lg p-3 mb-6 shadow-md sticky top-20 z-10 mx-4 mt-4">
        <div className="max-w-4xl mx-auto text-center font-medium">
          {getStageTip(gameStage, selectedCards.length)}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Betting Advice - Top Priority */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <Target className="h-6 w-6 text-poker-gold" />
            Betting Advice
            {advice.confidence === 'high' && <Zap className="h-5 w-5 text-yellow-400" />}
          </h2>
          
          <div className={`p-6 rounded-xl border-2 ${getAdviceStyle(advice)} shadow-lg`}>
            <p className="text-2xl font-bold text-center mb-2">
              {advice.action}
            </p>
            <p className="text-center text-sm opacity-90">
              {advice.reasoning}
            </p>
            <div className="flex justify-center items-center gap-4 mt-3 text-xs">
              <span className={`px-2 py-1 rounded ${
                advice.confidence === 'high' ? 'bg-green-600' :
                advice.confidence === 'medium' ? 'bg-yellow-600' : 'bg-gray-600'
              }`}>
                {advice.confidence.toUpperCase()} CONFIDENCE
              </span>
              <span className="px-2 py-1 rounded bg-gray-700">
                {advice.stage.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Strategy Notes */}
          {selectedCards.length >= 2 && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <p className="text-sm font-medium text-gray-300 mb-2">💡 Strategy Notes:</p>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Pre-flop: Bet 4x with pairs, suited Aces, or Broadway cards</li>
                <li>• Post-flop: Bet 3x with 60%+ win rate, check with 40-60%</li>
                <li>• Consider folding with less than 30% win probability</li>
                <li>• {isPremiumHand(holeCards) ? "✨ You have a premium starting hand!" : "Standard hand - play carefully"}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Card Picker */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="h-6 w-6 text-poker-gold" />
            <h2 className="text-2xl font-bold">Select Your Cards</h2>
          </div>
          <CardPicker onSelect={setSelectedCards} selectedCards={selectedCards} />
        </div>

        {/* Results Panel */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Hand Information */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Spades className="h-5 w-5 text-poker-gold" />
              Hand Analysis
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Selected Cards ({selectedCards.length}/7)</p>
                <p className="font-mono text-lg text-white">
                  {selectedCards.length > 0 ? formatCards(selectedCards) : "None selected"}
                </p>
              </div>

              {holeCards.length === 2 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">🃏 Hole Cards</p>
                  <p className="font-mono text-xl text-blue-400 font-bold">
                    {formatCards(holeCards)}
                  </p>
                  {isPremiumHand(holeCards) && (
                    <p className="text-xs text-yellow-400 mt-1">⭐ Premium starting hand</p>
                  )}
                </div>
              )}

              {communityCards.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">🏘️ Community Cards</p>
                  <p className="font-mono text-xl text-green-400 font-bold">
                    {formatCards(communityCards)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-400 mb-2">🏆 Best Hand</p>
                <p className="font-bold text-xl text-poker-gold">
                  {handDescription}
                </p>
              </div>

              {/* Game Stage Indicator */}
              <div className="pt-4 border-t border-gray-600">
                <p className="text-sm text-gray-400 mb-2">🎯 Current Stage</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    gameStage === 'preflop' ? 'bg-blue-600' :
                    gameStage === 'flop' ? 'bg-green-600' :
                    gameStage === 'turn' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {gameStage.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-300">
                    {gameStage === 'preflop' && "Initial hand evaluation"}
                    {gameStage === 'flop' && "Three community cards"}
                    {gameStage === 'turn' && "Fourth community card"}
                    {gameStage === 'river' && "Final community card"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Monte Carlo Simulation Results */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-poker-gold" />
              Monte Carlo Simulation
            </h3>

            {(isSimulating || isPending) && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poker-gold"></div>
                <span className="ml-4 text-gray-400 font-medium">
                  Running 1,000 simulations...
                </span>
              </div>
            )}

            {simulationResult && !isSimulating && !isPending && (
              <div className="space-y-4">
                <ProgressBar 
                  label="Win Probability" 
                  value={simulationResult.win} 
                  color="bg-gradient-to-r from-green-600 to-green-500"
                  icon={<span className="text-green-400">🏆</span>}
                />
                <ProgressBar 
                  label="Tie Probability" 
                  value={simulationResult.tie} 
                  color="bg-gradient-to-r from-yellow-600 to-yellow-500"
                  icon={<span className="text-yellow-400">🤝</span>}
                />
                <ProgressBar 
                  label="Lose Probability" 
                  value={simulationResult.lose} 
                  color="bg-gradient-to-r from-red-600 to-red-500"
                  icon={<span className="text-red-400">💔</span>}
                />
                
                <div className="pt-4 border-t border-gray-600">
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>Simulations: {simulationResult.iterations.toLocaleString()}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      simulationResult.confidence >= 90 ? 'bg-green-600' :
                      simulationResult.confidence >= 80 ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}>
                      {simulationResult.confidence}% Confidence
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!simulationResult && !isSimulating && !isPending && selectedCards.length < 5 && (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select at least 5 cards</p>
                <p className="text-sm">to run Monte Carlo simulation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500">
          <p className="text-lg font-medium">
            Ultimate Texas Hold'em Advisor • Built with React + TypeScript + Monte Carlo Simulation
          </p>
          <p className="text-sm mt-2">
            For entertainment and educational purposes only. Gamble responsibly. 🎲
          </p>
          <div className="flex justify-center items-center gap-4 mt-4 text-xs">
            <span>Powered by pokersolver</span>
            <span>•</span>
            <span>Statistical analysis</span>
            <span>•</span>
            <span>Professional strategy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}