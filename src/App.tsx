import React, { useState, useEffect, useRef } from "react";
import { Spade as Spades, TrendingUp, Calculator, Target, Zap, Clock, Bot } from "lucide-react";
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
import OpenAIAdvisor from "./components/OpenAIAdvisor";

/**
 * Ultimate Texas Hold'em Poker Advisor with OpenAI Integration
 * 
 * A comprehensive poker strategy tool that provides:
 * - Real-time betting advice based on hand strength
 * - Monte Carlo simulation for win probability analysis
 * - AI-powered advanced betting recommendations via OpenAI API
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
  const [isSimulating, setIsSimulating] = useState(false);
  const [fastMode, setFastMode] = useState(true);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Ref to track current simulation to prevent race conditions
  const currentSimulationRef = useRef<number>(0);

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
    console.log(`🔄 Cards changed: ${selectedCards.length} cards`, selectedCards);
    
    // Clear previous state
    setSimulationError(null);
    
    // Increment simulation counter to cancel any running simulations
    currentSimulationRef.current += 1;
    const thisSimulation = currentSimulationRef.current;

    if (selectedCards.length < 2) {
      console.log('📝 Not enough cards - showing initial message');
      setAdvice({
        action: "Select your 2 hole cards to begin",
        confidence: 'low',
        reasoning: "Need hole cards to analyze",
        stage: 'preflop'
      });
      setSimulationResult(null);
      setIsSimulating(false);
      return;
    }

    if (selectedCards.length === 2) {
      console.log('📝 Pre-flop advice only');
      // Pre-flop advice only
      const preflopAdvice = getPreflopAdvice(holeCards);
      console.log('📝 Pre-flop advice:', preflopAdvice);
      setAdvice(preflopAdvice);
      setSimulationResult(null);
      setIsSimulating(false);
      return;
    }

    if (selectedCards.length < 5) {
      console.log('📝 Need more community cards');
      // Still need more community cards
      setAdvice({
        action: "Add more community cards for analysis",
        confidence: 'low',
        reasoning: "Need at least 5 cards total",
        stage: gameStage
      });
      setSimulationResult(null);
      setIsSimulating(false);
      return;
    }

    // Run Monte Carlo simulation for 5+ cards
    console.log('🎲 Starting simulation for 5+ cards');
    setIsSimulating(true);
    setAdvice({
      action: "🎲 Analyzing your hand...",
      confidence: 'medium',
      reasoning: "Running probability calculations",
      stage: gameStage
    });
    
    // Run simulation
    const runSimulation = async () => {
      try {
        console.log(`🚀 Starting simulation #${thisSimulation} with ${selectedCards.length} cards`);
        
        const iterations = fastMode ? 300 : 1000;
        const simulationFunction = fastMode ? quickSimulation : monteCarloSimulation;
        
        const result = await simulationFunction(selectedCards, iterations);
        
        console.log(`📊 Simulation #${thisSimulation} result:`, result);
        
        // Only update if this simulation is still current
        if (currentSimulationRef.current === thisSimulation) {
          console.log(`✅ Simulation #${thisSimulation} completed successfully - updating advice`);
          
          // Update simulation result first
          setSimulationResult(result);
          
          // Get and set advice
          const postflopAdvice = getPostflopAdvice(result.win, gameStage);
          console.log(`📝 Generated advice:`, postflopAdvice);
          setAdvice(postflopAdvice);
          
          // Clear simulation state
          setIsSimulating(false);
          setSimulationError(null);
          
          console.log(`🎯 Final advice set:`, postflopAdvice);
        } else {
          console.log(`❌ Simulation #${thisSimulation} was superseded by #${currentSimulationRef.current}`);
        }
        
      } catch (error) {
        console.error(`💥 Simulation #${thisSimulation} failed:`, error);
        
        // Only update if this simulation is still current
        if (currentSimulationRef.current === thisSimulation) {
          const errorMessage = error instanceof Error ? error.message : "Unknown simulation error";
          setSimulationError(errorMessage);
          setAdvice({
            action: "⚠️ Calculation Error",
            confidence: 'low',
            reasoning: "Unable to calculate probabilities",
            stage: gameStage
          });
          setIsSimulating(false);
        }
      }
    };

    // Start simulation immediately
    runSimulation();
    
  }, [selectedCards, fastMode]);

  /**
   * Reset all state
   */
  const handleReset = () => {
    console.log('🔄 Resetting all state');
    currentSimulationRef.current += 1; // Cancel any running simulation
    setSelectedCards([]);
    setSimulationResult(null);
    setSimulationError(null);
    setIsSimulating(false);
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
    <div className="mb-2">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-gray-300 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-bold text-white">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <Spades className="h-6 w-6 text-yellow-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Ultimate Texas Hold'em Advisor
            </h1>
            <Bot className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-center text-gray-400 mt-1 text-xs">
            Professional poker strategy with Monte Carlo simulation + AI advice
          </p>
        </div>
      </div>

      {/* Dynamic Tip Banner */}
      <div className="bg-yellow-100 text-yellow-900 text-xs rounded-lg p-2 mx-4 mt-2 shadow-md">
        <div className="text-center font-medium">
          {tipMessage}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="h-[calc(100vh-140px)] p-4">
        <div className="h-full grid grid-cols-12 grid-rows-12 gap-3">
          
          {/* Betting Advice - Top Full Width */}
          <div className="col-span-12 row-span-4 bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-yellow-500" />
                Betting Advice
                {advice.confidence === 'high' && !isSimulating && <Zap className="h-3 w-3 text-yellow-400" />}
                {isSimulating && <Clock className="h-3 w-3 text-blue-400 animate-spin" />}
              </h2>
              
              {/* Fast Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Fast Mode</span>
                <button
                  onClick={() => setFastMode(!fastMode)}
                  disabled={isSimulating}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    fastMode ? 'bg-green-600' : 'bg-gray-600'
                  } ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      fastMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-500">
                  {fastMode ? '300' : '1000'}
                </span>
              </div>
            </div>
            
            <div className={`p-3 rounded-xl border-2 ${getAdviceStyle(advice)} shadow-lg mb-3`}>
              <p className="text-lg font-bold text-center mb-1">
                {advice.action}
              </p>
              <p className="text-center text-xs opacity-90 mb-2">
                {advice.reasoning}
              </p>
              <div className="flex justify-center items-center gap-3 text-xs">
                <span className={`px-2 py-1 rounded ${
                  advice.confidence === 'high' ? 'bg-green-600' :
                  advice.confidence === 'medium' ? 'bg-yellow-600' : 'bg-gray-600'
                }`}>
                  {advice.confidence.toUpperCase()}
                </span>
                <span className="px-2 py-1 rounded bg-gray-700">
                  {advice.stage.toUpperCase()}
                </span>
                {isSimulating && (
                  <span className="px-2 py-1 rounded bg-blue-600 animate-pulse">
                    CALCULATING
                  </span>
                )}
              </div>
            </div>

            {/* AI Advisor Component */}
            <OpenAIAdvisor 
              selectedCards={selectedCards}
              simulationResult={simulationResult}
              gameStage={gameStage}
              handDescription={handDescription}
            />

            {/* Error Display */}
            {simulationError && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-500 rounded-lg">
                <p className="text-xs text-red-400 font-medium">⚠️ Error: {simulationError}</p>
                <button
                  onClick={handleReset}
                  className="mt-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Hand Analysis - Left Side */}
          <div className="col-span-3 row-span-8 bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700 shadow-xl">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Spades className="h-3 w-3 text-yellow-500" />
              Hand Analysis
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-gray-400 mb-1">Cards ({selectedCards.length}/7)</p>
                <p className="font-mono text-xs text-white break-all">
                  {selectedCards.length > 0 ? formatCards(selectedCards) : "None"}
                </p>
              </div>

              {holeCards.length === 2 && (
                <div>
                  <p className="text-gray-400 mb-1">🃏 Hole Cards</p>
                  <p className="font-mono text-sm text-blue-400 font-bold">
                    {formatCards(holeCards)}
                  </p>
                  {isPremiumHand(holeCards) && (
                    <p className="text-xs text-yellow-400 mt-1">⭐ Premium</p>
                  )}
                </div>
              )}

              {communityCards.length > 0 && (
                <div>
                  <p className="text-gray-400 mb-1">🏘️ Community</p>
                  <p className="font-mono text-sm text-green-400 font-bold break-all">
                    {formatCards(communityCards)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-gray-400 mb-1">🏆 Best Hand</p>
                <p className="font-bold text-sm text-yellow-500">
                  {handDescription}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-600">
                <p className="text-gray-400 mb-2">🎯 Stage</p>
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold text-center ${
                    gameStage === 'preflop' ? 'bg-blue-600' :
                    gameStage === 'flop' ? 'bg-green-600' :
                    gameStage === 'turn' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {gameStage.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Reset Button */}
              {selectedCards.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleReset}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-xs"
                  >
                    Reset Hand
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card Picker - Center */}
          <div className="col-span-6 row-span-8 bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 border border-gray-700 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-yellow-500" />
                <h2 className="text-sm font-bold">Select Your Cards</h2>
              </div>
              <div className="text-xs text-gray-300">
                {selectedCards.length}/7
              </div>
            </div>
            <div className="h-[calc(100%-2rem)] overflow-auto">
              <CardPicker onSelect={setSelectedCards} selectedCards={selectedCards} />
            </div>
          </div>

          {/* Monte Carlo Simulation - Right Side */}
          <div className="col-span-3 row-span-8 bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-gray-700 shadow-xl">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-yellow-500" />
              Monte Carlo
              {fastMode && <span className="text-xs bg-green-600 px-1 py-0.5 rounded">FAST</span>}
            </h3>

            {isSimulating && (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mb-2"></div>
                <span className="text-gray-400 font-medium text-xs text-center">
                  Running {fastMode ? '300' : '1,000'} simulations...
                </span>
              </div>
            )}

            {simulationResult && !isSimulating && !simulationError && (
              <div className="space-y-2">
                <ProgressBar 
                  label="Win" 
                  value={simulationResult.win} 
                  color="bg-gradient-to-r from-green-600 to-green-500"
                  icon={<span className="text-green-400">🏆</span>}
                />
                <ProgressBar 
                  label="Tie" 
                  value={simulationResult.tie} 
                  color="bg-gradient-to-r from-blue-600 to-blue-500"
                  icon={<span className="text-blue-400">🤝</span>}
                />
                <ProgressBar 
                  label="Lose" 
                  value={simulationResult.lose} 
                  color="bg-gradient-to-r from-red-600 to-red-500"
                  icon={<span className="text-red-400">💔</span>}
                />
                
                <div className="pt-2 border-t border-gray-600">
                  <div className="text-xs text-gray-400 text-center">
                    {simulationResult.iterations.toLocaleString()} iterations
                  </div>
                </div>
              </div>
            )}

            {simulationError && (
              <div className="text-center py-6 text-red-400">
                <div className="text-2xl mb-2">⚠️</div>
                <p className="text-xs font-medium">Simulation Error</p>
                <button
                  onClick={handleReset}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                >
                  Reset
                </button>
              </div>
            )}

            {!simulationResult && !isSimulating && selectedCards.length < 5 && !simulationError && (
              <div className="text-center py-6 text-gray-500">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Select 5+ cards</p>
                <p className="text-xs">for simulation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}