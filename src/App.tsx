import React, { useState, useEffect, useTransition } from "react";
import { Spade as Spades, TrendingUp, Calculator, Target, Zap, Clock } from "lucide-react";
import CardPicker from "./components/CardPicker";
import { evaluateHand, formatCards, isPremiumHand } from "./components/HandEvaluator";
import { 
  getPreflopAdvice, 
  getPostflopAdvice, 
  getGameStage,
  getTipMessage,
  type BettingAdvice 
} from "./components/BetAdvisor";
import { monteCarloSimulation, quickSimulation, type SimulationResult } from "./utils/monteCarlo";

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
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
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
  const [fastMode, setFastMode] = useState(true);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Derived state
  const gameStage = getGameStage(selectedCards.length);
  const holeCards = selectedCards.slice(0, 2);
  const communityCards = selectedCards.slice(2);
  const tipMessage = getTipMessage(gameStage, selectedCards.length);
  
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
    // Clear any previous errors
    setSimulationError(null);

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
      action: "🕐 Calculating odds...",
      confidence: 'medium',
      reasoning: "Running Monte Carlo simulation",
      stage: gameStage
    });
    
    // Use startTransition to mark this as a non-urgent update
    startTransition(() => {
      const simulationFunction = fastMode ? quickSimulation : monteCarloSimulation;
      const iterations = fastMode ? 300 : 1000;
      
      // Run simulation asynchronously
      simulationFunction(selectedCards, iterations)
        .then((result) => {
          setSimulationResult(result);
          const postflopAdvice = getPostflopAdvice(result.win, gameStage);
          setAdvice(postflopAdvice);
          setSimulationError(null);
        })
        .catch((error) => {
          console.error("Simulation error:", error);
          setSimulationError(error.message || "Unknown error occurred");
          setAdvice({
            action: "⚠️ Simulation Error",
            confidence: 'low',
            reasoning: "Please try selecting different cards",
            stage: gameStage
          });
        })
        .finally(() => {
          setIsSimulating(false);
        });
    });
  }, [selectedCards, gameStage, holeCards, fastMode]);

  /**
   * Reset all state
   */
  const handleReset = () => {
    setSelectedCards([]);
    setSimulationResult(null);
    setSimulationError(null);
    setAdvice({
      action: "Select your 2 hole cards to begin",
      confidence: 'low',
      reasoning: "Need cards to analyze",
      stage: 'preflop'
    });
  };

  /**
   * Get advice styling based on action type
   */
  const getAdviceStyle = (advice: BettingAdvice): string => {
    const action = advice.action.toLowerCase();
    
    if (action.includes("error")) {
      return "text-red-400 bg-red-900/20 border-red-500";
    } else if (action.includes("4x") || action.includes("3x")) {
      return "text-green-400 bg-green-900/20 border-green-500";
    } else if (action.includes("2x")) {
      return "text-yellow-400 bg-yellow-900/20 border-yellow-500";
    } else if (action.includes("check")) {
      return "text-blue-400 bg-blue-900/20 border-blue-500";
    } else if (action.includes("fold")) {
      return "text-red-400 bg-red-900/20 border-red-500";
    } else {
      return "text-gray-400 bg-gray-900/20 border-gray-500";
    }
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
    <div className="mb-3">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-gray-300 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-bold text-white">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-3 rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <Spades className="h-7 w-7 text-yellow-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Ultimate Texas Hold'em Advisor
            </h1>
            <Target className="h-7 w-7 text-yellow-500" />
          </div>
          <p className="text-center text-gray-400 mt-1 text-sm">
            Professional poker strategy with Monte Carlo simulation
          </p>
        </div>
      </div>

      {/* Dynamic Tip Banner */}
      <div className="bg-yellow-100 text-yellow-900 text-sm rounded-lg p-3 mb-4 shadow-md sticky top-16 z-10 mx-4 mt-4">
        <div className="max-w-4xl mx-auto text-center font-medium">
          {tipMessage}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
        {/* Betting Advice - Top Priority */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
            <Target className="h-5 w-5 text-yellow-500" />
            Betting Advice
            {advice.confidence === 'high' && <Zap className="h-4 w-4 text-yellow-400" />}
            {(isSimulating || isPending) && <Clock className="h-4 w-4 text-blue-400 animate-spin" />}
          </h2>
          
          <div className={`p-4 rounded-xl border-2 ${getAdviceStyle(advice)} shadow-lg`}>
            <p className="text-xl font-bold text-center mb-2">
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

          {/* Error Display */}
          {simulationError && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-sm text-red-400 font-medium">⚠️ Simulation Error:</p>
              <p className="text-xs text-red-300 mt-1">{simulationError}</p>
              <p className="text-xs text-gray-400 mt-2">Try selecting different cards or refresh the page.</p>
            </div>
          )}

          {/* Strategy Notes */}
          {selectedCards.length >= 2 && !simulationError && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
              <p className="text-sm font-medium text-gray-300 mb-2">💡 Strategy Notes:</p>
              <ul className="text-xs space-y-1 text-gray-300">
                <li>• Pre-flop: Bet 4x with pairs, suited Aces, or Broadway cards</li>
                <li>• Post-flop: Bet 3x with 60%+ win rate, 2x with 40-60%</li>
                <li>• Consider folding with less than 40% win probability</li>
                <li>• {isPremiumHand(holeCards) ? "✨ You have a premium starting hand!" : "Standard hand - play carefully"}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Card Picker */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-bold">Select Your Cards</h2>
            </div>
            
            {/* Fast Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Fast Mode</span>
              <button
                onClick={() => setFastMode(!fastMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  fastMode ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    fastMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs text-gray-500">
                {fastMode ? '300 iter' : '1000 iter'}
              </span>
            </div>
          </div>
          <CardPicker onSelect={setSelectedCards} selectedCards={selectedCards} />
        </div>

        {/* Results Panel */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Hand Information */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Spades className="h-4 w-4 text-yellow-500" />
              Hand Analysis
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Selected Cards ({selectedCards.length}/7)</p>
                <p className="font-mono text-base text-white">
                  {selectedCards.length > 0 ? formatCards(selectedCards) : "None selected"}
                </p>
              </div>

              {holeCards.length === 2 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">🃏 Hole Cards</p>
                  <p className="font-mono text-lg text-blue-400 font-bold">
                    {formatCards(holeCards)}
                  </p>
                  {isPremiumHand(holeCards) && (
                    <p className="text-xs text-yellow-400 mt-1">⭐ Premium starting hand</p>
                  )}
                </div>
              )}

              {communityCards.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">🏘️ Community Cards</p>
                  <p className="font-mono text-lg text-green-400 font-bold">
                    {formatCards(communityCards)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-400 mb-1">🏆 Best Hand</p>
                <p className="font-bold text-lg text-yellow-500">
                  {handDescription}
                </p>
              </div>

              {/* Game Stage Indicator */}
              <div className="pt-3 border-t border-gray-600">
                <p className="text-sm text-gray-400 mb-2">🎯 Current Stage</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
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
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-500" />
              Monte Carlo Simulation
              {fastMode && <span className="text-xs bg-green-600 px-2 py-1 rounded">FAST</span>}
            </h3>

            {(isSimulating || isPending) && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                <span className="ml-3 text-gray-400 font-medium text-sm">
                  Running {fastMode ? '300' : '1,000'} simulations...
                </span>
              </div>
            )}

            {simulationResult && !isSimulating && !isPending && !simulationError && (
              <div className="space-y-3">
                <ProgressBar 
                  label="Win Probability" 
                  value={simulationResult.win} 
                  color="bg-gradient-to-r from-green-600 to-green-500"
                  icon={<span className="text-green-400">🏆</span>}
                />
                <ProgressBar 
                  label="Tie Probability" 
                  value={simulationResult.tie} 
                  color="bg-gradient-to-r from-blue-600 to-blue-500"
                  icon={<span className="text-blue-400">🤝</span>}
                />
                <ProgressBar 
                  label="Lose Probability" 
                  value={simulationResult.lose} 
                  color="bg-gradient-to-r from-red-600 to-red-500"
                  icon={<span className="text-red-400">💔</span>}
                />
                
                <div className="pt-3 border-t border-gray-600">
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>Simulations: {simulationResult.iterations.toLocaleString()}</span>
                    <span className="text-xs">
                      Mode: {fastMode ? 'Fast (300)' : 'Full (1000)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {simulationError && (
              <div className="text-center py-8 text-red-400">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-base font-medium">Simulation Error</p>
                <p className="text-sm mt-2">{simulationError}</p>
                <button
                  onClick={handleReset}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Reset and Try Again
                </button>
              </div>
            )}

            {!simulationResult && !isSimulating && !isPending && selectedCards.length < 5 && !simulationError && (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-base font-medium">Select at least 5 cards</p>
                <p className="text-sm">to run Monte Carlo simulation</p>
              </div>
            )}
          </div>
        </div>

        {/* Reset Button */}
        {selectedCards.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Reset Hand
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500">
          <p className="text-base font-medium">
            Ultimate Texas Hold'em Advisor • Built with React + TypeScript + Monte Carlo Simulation
          </p>
          <p className="text-sm mt-2">
            For entertainment and educational purposes only. Gamble responsibly. 🎲
          </p>
          <div className="flex justify-center items-center gap-4 mt-3 text-xs">
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