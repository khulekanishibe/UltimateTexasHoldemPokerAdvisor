import React, { useState, useEffect, useRef } from 'react';
import { Bot, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { formatCards } from './HandEvaluator';
import type { SimulationResult } from '../utils/monteCarlo';
import type { GameStage } from './BetAdvisor';

/**
 * OpenAI Advisor Props Interface
 */
interface OpenAIAdvisorProps {
  selectedCards: string[];
  simulationResult: SimulationResult | null;
  gameStage: GameStage;
  handDescription: string;
}

/**
 * AI Advice Response Interface
 */
interface AIAdvice {
  recommendation: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

/**
 * OpenAI Advisor Component
 * 
 * Integrates with OpenAI API to provide advanced poker strategy advice
 * based on current hand, odds, and game situation.
 */
export default function OpenAIAdvisor({ 
  selectedCards, 
  simulationResult, 
  gameStage, 
  handDescription 
}: OpenAIAdvisorProps) {
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestCards, setLastRequestCards] = useState<string>('');
  
  // Ref to track current request to prevent race conditions
  const currentRequestRef = useRef<number>(0);

  /**
   * Generate AI advice prompt based on current game state
   */
  const generatePrompt = (): string => {
    const holeCards = selectedCards.slice(0, 2);
    const communityCards = selectedCards.slice(2);
    
    let prompt = `You are a professional Ultimate Texas Hold'em poker advisor. Analyze this hand and provide strategic advice.

GAME SITUATION:
- Game: Ultimate Texas Hold'em
- Stage: ${gameStage.toUpperCase()}
- Hole Cards: ${formatCards(holeCards)}`;

    if (communityCards.length > 0) {
      prompt += `
- Community Cards: ${formatCards(communityCards)}
- Best Hand: ${handDescription}`;
    }

    if (simulationResult) {
      prompt += `
- Win Probability: ${simulationResult.win.toFixed(1)}%
- Tie Probability: ${simulationResult.tie.toFixed(1)}%
- Lose Probability: ${simulationResult.lose.toFixed(1)}%`;
    }

    prompt += `

ULTIMATE TEXAS HOLD'EM RULES:
- Pre-flop: Can bet 4x or 2x ante, or check
- Post-flop: Can bet 3x or 2x ante, or check  
- Post-turn/river: Can bet 1x ante or fold

Please provide:
1. Your recommended action (specific bet size or check/fold)
2. Detailed reasoning for this recommendation
3. Your confidence level (high/medium/low)
4. Risk assessment (conservative/moderate/aggressive)

Respond in JSON format:
{
  "recommendation": "specific action recommendation",
  "reasoning": "detailed strategic reasoning",
  "confidence": "high|medium|low",
  "riskLevel": "conservative|moderate|aggressive"
}`;

    return prompt;
  };

  /**
   * Call OpenAI API for advanced poker advice
   */
  const getAIAdvice = async (): Promise<void> => {
    // Increment request counter to cancel any previous requests
    currentRequestRef.current += 1;
    const thisRequest = currentRequestRef.current;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🤖 Requesting AI advice...');
      
      const prompt = generatePrompt();
      console.log('📝 Generated prompt:', prompt);

      // Call OpenAI API via backend endpoint (to keep API key secure)
      const response = await fetch('/api/openai-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🤖 AI response:', data);

      // Only update if this request is still current
      if (currentRequestRef.current === thisRequest) {
        if (data.error) {
          throw new Error(data.error);
        }

        // Parse AI advice (expect JSON response)
        let advice: AIAdvice;
        if (typeof data.advice === 'string') {
          try {
            advice = JSON.parse(data.advice);
          } catch {
            // Fallback if not valid JSON
            advice = {
              recommendation: data.advice,
              reasoning: "AI provided general advice",
              confidence: 'medium',
              riskLevel: 'moderate'
            };
          }
        } else {
          advice = data.advice;
        }

        setAiAdvice(advice);
        setIsLoading(false);
        console.log('✅ AI advice updated:', advice);
      } else {
        console.log('❌ AI request was superseded');
      }

    } catch (err) {
      console.error('💥 AI advice request failed:', err);
      
      // Only update if this request is still current
      if (currentRequestRef.current === thisRequest) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsLoading(false);
      }
    }
  };

  /**
   * Effect to trigger AI advice when conditions are met
   */
  useEffect(() => {
    // Only request AI advice for post-flop situations with simulation results
    if (selectedCards.length >= 5 && simulationResult && !isLoading) {
      const cardsKey = selectedCards.join(',');
      
      // Avoid duplicate requests for the same cards
      if (cardsKey !== lastRequestCards) {
        setLastRequestCards(cardsKey);
        
        // Add small delay to let Monte Carlo complete
        const timer = setTimeout(() => {
          getAIAdvice();
        }, 500);

        return () => clearTimeout(timer);
      }
    } else {
      // Clear AI advice for pre-flop or insufficient cards
      setAiAdvice(null);
      setError(null);
      setLastRequestCards('');
    }
  }, [selectedCards, simulationResult]);

  /**
   * Get styling for AI advice based on risk level
   */
  const getAIAdviceStyle = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'conservative':
        return 'bg-blue-900/20 border-blue-500 text-blue-400';
      case 'aggressive':
        return 'bg-red-900/20 border-red-500 text-red-400';
      default:
        return 'bg-purple-900/20 border-purple-500 text-purple-400';
    }
  };

  // Don't render anything for pre-flop or insufficient cards
  if (selectedCards.length < 5) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-3 w-3 text-blue-500" />
          <h4 className="text-xs font-bold text-blue-400">AI Strategic Advisor</h4>
          <Sparkles className="h-2 w-2 text-yellow-400" />
        </div>
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">
            AI advisor available after Monte Carlo simulation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-3 w-3 text-blue-500" />
        <h4 className="text-xs font-bold text-blue-400">AI Strategic Advisor</h4>
        <Sparkles className="h-2 w-2 text-yellow-400" />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-3 w-3 animate-spin text-blue-500 mr-2" />
          <span className="text-xs text-gray-400">Consulting AI...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-500 rounded text-red-400">
          <AlertCircle className="h-2 w-2" />
          <div className="text-xs">
            <p className="font-medium">AI Unavailable</p>
            <p className="text-red-300 mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      {aiAdvice && !isLoading && (
        <div className={`p-2 rounded-lg border ${getAIAdviceStyle(aiAdvice.riskLevel)}`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold">
              🤖 {aiAdvice.recommendation}
            </p>
            <div className="flex gap-1">
              <span className={`px-1 py-0.5 rounded text-xs ${
                aiAdvice.confidence === 'high' ? 'bg-green-600' :
                aiAdvice.confidence === 'medium' ? 'bg-yellow-600' : 'bg-gray-600'
              }`}>
                {aiAdvice.confidence.toUpperCase()}
              </span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                aiAdvice.riskLevel === 'conservative' ? 'bg-blue-600' :
                aiAdvice.riskLevel === 'aggressive' ? 'bg-red-600' : 'bg-purple-600'
              }`}>
                {aiAdvice.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">
            {aiAdvice.reasoning}
          </p>
        </div>
      )}

      {!aiAdvice && !isLoading && !error && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">
            AI will analyze after simulation completes
          </p>
        </div>
      )}
    </div>
  );
}