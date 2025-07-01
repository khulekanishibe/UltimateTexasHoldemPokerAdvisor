import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Loader2,
  AlertCircle,
  Sparkles,
  Brain,
  Zap,
  Key,
} from "lucide-react";
import { formatCards } from "./HandEvaluator";
import type { SimulationResult } from "../utils/monteCarlo";
import type { GameStage } from "./BetAdvisor";

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
  confidence: "high" | "medium" | "low";
  riskLevel: "conservative" | "moderate" | "aggressive";
}

/**
 * Generate fallback advice based on simulation results and game theory
 */
function generateFallbackAdvice(
  selectedCards: string[],
  simulationResult: SimulationResult | null,
  gameStage: GameStage,
  handDescription: string,
): AIAdvice {
  const holeCards = selectedCards.slice(0, 2);
  const communityCards = selectedCards.slice(2);

  // Pre-flop fallback advice
  if (gameStage === "preflop" || !simulationResult) {
    const [card1, card2] = holeCards;
    const rank1 = card1?.slice(0, -1);
    const suit1 = card1?.slice(-1);
    const rank2 = card2?.slice(0, -1);
    const suit2 = card2?.slice(-1);

    const suited = suit1 === suit2;
    const isPair = rank1 === rank2;
    const strongRanks = ["A", "K", "Q", "J", "10"];

    if (isPair && rank1 === "A") {
      return {
        recommendation: "Max Bet 4x",
        reasoning:
          "Pocket Aces are the strongest starting hand. Maximum aggression is warranted.",
        confidence: "high",
        riskLevel: "aggressive",
      };
    }

    if (
      isPair ||
      (suited && strongRanks.includes(rank1) && strongRanks.includes(rank2))
    ) {
      return {
        recommendation: "Bet 4x",
        reasoning:
          "Premium starting hand with excellent potential. Strong betting position.",
        confidence: "high",
        riskLevel: "aggressive",
      };
    }

    return {
      recommendation: "Check or Small Bet",
      reasoning:
        "Marginal starting hand. Wait for more information before committing.",
      confidence: "medium",
      riskLevel: "conservative",
    };
  }

  // Post-flop advice based on simulation
  const winRate = simulationResult.win;

  if (winRate >= 70) {
    return {
      recommendation: "Bet 3x Aggressively",
      reasoning: `Excellent ${winRate.toFixed(1)}% win rate. Strong hand with great equity. Maximize value.`,
      confidence: "high",
      riskLevel: "aggressive",
    };
  }

  if (winRate >= 55) {
    return {
      recommendation: "Bet 3x Confidently",
      reasoning: `Strong ${winRate.toFixed(1)}% win rate gives you a significant edge. Press your advantage.`,
      confidence: "high",
      riskLevel: "moderate",
    };
  }

  if (winRate >= 45) {
    return {
      recommendation: "Bet 2x Cautiously",
      reasoning: `Favorable ${winRate.toFixed(1)}% win rate. Moderate betting to build pot while managing risk.`,
      confidence: "medium",
      riskLevel: "moderate",
    };
  }

  if (winRate >= 35) {
    return {
      recommendation: "Check and Evaluate",
      reasoning: `Marginal ${winRate.toFixed(1)}% win rate. See more cards cheaply before committing.`,
      confidence: "medium",
      riskLevel: "conservative",
    };
  }

  return {
    recommendation: "Consider Folding",
    reasoning: `Weak ${winRate.toFixed(1)}% win rate. Cutting losses may be the best strategy.`,
    confidence: "high",
    riskLevel: "conservative",
  };
}

/**
 * OpenAI Strategic Advisor Component
 *
 * Provides advanced poker strategy advice using OpenAI API with
 * sophisticated fallback logic based on game theory and simulation results.
 */
export default function OpenAIAdvisor({
  selectedCards,
  simulationResult,
  gameStage,
  handDescription,
}: OpenAIAdvisorProps) {
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastRequestCards, setLastRequestCards] = useState<string>("");
  const [needsApiKey, setNeedsApiKey] = useState(false);

  // Ref to track current request to prevent race conditions
  const currentRequestRef = useRef<number>(0);

  /**
   * Generate AI advice prompt based on current game state
   */
  const generatePrompt = (): string => {
    const holeCards = selectedCards.slice(0, 2);
    const communityCards = selectedCards.slice(2);

    let prompt = `Analyze this Ultimate Texas Hold'em hand:

SITUATION:
- Stage: ${gameStage.toUpperCase()}
- Hole Cards: ${formatCards(holeCards)}`;

    if (communityCards.length > 0) {
      prompt += `
- Community Cards: ${formatCards(communityCards)}
- Best Hand: ${handDescription}`;
    }

    if (simulationResult) {
      prompt += `
- Win Rate: ${simulationResult.win.toFixed(1)}%
- Tie Rate: ${simulationResult.tie.toFixed(1)}%
- Lose Rate: ${simulationResult.lose.toFixed(1)}%`;
    }

    prompt += `

BETTING OPTIONS:
- Pre-flop: 4x bet, 2x bet, or check
- Post-flop: 3x bet, 2x bet, or check
- Turn/River: 1x bet or fold

Provide your recommendation in JSON format with these exact fields:
- recommendation: specific action
- reasoning: brief strategic explanation
- confidence: "high", "medium", or "low"
- riskLevel: "conservative", "moderate", or "aggressive"`;

    return prompt;
  };

  /**
   * Try OpenAI API first, fallback to local logic if it fails
   */
  const getAdvice = async (): Promise<void> => {
    // Increment request counter to cancel any previous requests
    currentRequestRef.current += 1;
    const thisRequest = currentRequestRef.current;

    setIsLoading(true);
    setUsingFallback(false);
    setApiError(null);
    setNeedsApiKey(false);

    // First try OpenAI API
    try {
      console.log("🤖 Attempting OpenAI API request...");

      const prompt = generatePrompt();

      // Try the API with a reasonable timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/openai-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        // Only update if this request is still current
        if (currentRequestRef.current === thisRequest) {
          if (data.success && data.advice) {
            console.log("✅ OpenAI API successful:", data.advice);
            setAiAdvice(data.advice);
            setIsLoading(false);
            setApiError(null);
            return;
          } else {
            throw new Error(data.error || "Invalid API response");
          }
        }
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.error || `API failed: ${response.status}`;

        // Check if it's an API key issue
        if (
          errorMessage.includes("API key") ||
          errorMessage.includes("not configured")
        ) {
          setNeedsApiKey(true);
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.log("⚠️ OpenAI API failed, using fallback:", errorMessage);

      // Only proceed with fallback if this request is still current
      if (currentRequestRef.current === thisRequest) {
        // Check if it's an API key configuration issue
        if (
          errorMessage.includes("API key") ||
          errorMessage.includes("not configured")
        ) {
          setNeedsApiKey(true);
          setApiError(null); // Don't show error for missing API key, just use fallback
        } else {
          setApiError(errorMessage);
        }

        // Use fallback logic
        const fallbackAdvice = generateFallbackAdvice(
          selectedCards,
          simulationResult,
          gameStage,
          handDescription,
        );

        setAiAdvice(fallbackAdvice);
        setUsingFallback(true);
        setIsLoading(false);

        console.log("🧠 Fallback advice generated:", fallbackAdvice);
      }
    }
  };

  /**
   * Effect to trigger advice when conditions are met
   */
  useEffect(() => {
    // Provide advice for any hand with 2+ cards
    if (selectedCards.length >= 2 && !isLoading) {
      const cardsKey = selectedCards.join(",");

      // Avoid duplicate requests for the same cards
      if (cardsKey !== lastRequestCards) {
        setLastRequestCards(cardsKey);

        // Add small delay for post-flop to let Monte Carlo complete
        const delay = selectedCards.length >= 5 && simulationResult ? 500 : 100;
        const timer = setTimeout(() => {
          getAdvice();
        }, delay);

        return () => clearTimeout(timer);
      }
    } else if (selectedCards.length < 2) {
      // Clear advice for insufficient cards
      setAiAdvice(null);
      setUsingFallback(false);
      setApiError(null);
      setNeedsApiKey(false);
      setLastRequestCards("");
    }
  }, [selectedCards, simulationResult]);

  /**
   * Get styling for advice based on risk level
   */
  const getAdviceStyle = (riskLevel: string): string => {
    switch (riskLevel) {
      case "conservative":
        return "bg-blue-900/20 border-blue-500 text-blue-400";
      case "aggressive":
        return "bg-red-900/20 border-red-500 text-red-400";
      default:
        return "bg-purple-900/20 border-purple-500 text-purple-400";
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {usingFallback ? (
          <Brain className="h-3 w-3 text-purple-500" />
        ) : (
          <Bot className="h-3 w-3 text-blue-500" />
        )}
        <h4 className="text-xs font-bold text-blue-400">
          {usingFallback ? "Strategic Advisor" : "AI Strategic Advisor"}
        </h4>
        {!usingFallback && !apiError && (
          <Zap className="h-2 w-2 text-green-400" />
        )}
        {apiError && <AlertCircle className="h-2 w-2 text-red-400" />}
        {needsApiKey && <Key className="h-2 w-2 text-yellow-400" />}
      </div>

      {selectedCards.length < 2 && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">
            Strategic advice available after selecting hole cards
          </p>
        </div>
      )}

      {selectedCards.length >= 2 && (
        <>
          {isLoading && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500 mr-2" />
              <span className="text-xs text-gray-400">
                Analyzing strategy...
              </span>
            </div>
          )}

          {needsApiKey && !isLoading && !aiAdvice && (
            <div className="p-2 rounded-lg border border-gray-600 bg-gray-700/20 text-gray-400 mb-2">
              <div className="flex items-center gap-1 mb-1">
                <Key className="h-3 w-3" />
                <p className="text-xs font-bold">OpenAI Not Configured</p>
              </div>
              <p className="text-xs opacity-90">
                Using advanced game theory algorithms instead
              </p>
            </div>
          )}

          {aiAdvice && !isLoading && (
            <div
              className={`p-2 rounded-lg border ${getAdviceStyle(aiAdvice.riskLevel)}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold">
                  {usingFallback ? "🧠" : "🤖"} {aiAdvice.recommendation}
                </p>
                <div className="flex gap-1">
                  <span
                    className={`px-1 py-0.5 rounded text-xs ${
                      aiAdvice.confidence === "high"
                        ? "bg-green-600"
                        : aiAdvice.confidence === "medium"
                          ? "bg-yellow-600"
                          : "bg-gray-600"
                    }`}
                  >
                    {aiAdvice.confidence.toUpperCase()}
                  </span>
                  <span
                    className={`px-1 py-0.5 rounded text-xs ${
                      aiAdvice.riskLevel === "conservative"
                        ? "bg-blue-600"
                        : aiAdvice.riskLevel === "aggressive"
                          ? "bg-red-600"
                          : "bg-purple-600"
                    }`}
                  >
                    {aiAdvice.riskLevel.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {aiAdvice.reasoning}
              </p>

              {/* Status indicators */}
              <div className="mt-1 pt-1 border-t border-gray-600">
                {usingFallback && (
                  <p className="text-xs text-gray-400 italic flex items-center gap-1">
                    <Brain className="h-2 w-2" />
                    Using advanced game theory
                    {apiError && !needsApiKey && (
                      <span className="text-red-400">({apiError})</span>
                    )}
                  </p>
                )}
                {!usingFallback && !apiError && (
                  <p className="text-xs text-green-400 italic flex items-center gap-1">
                    <Zap className="h-2 w-2" />
                    Powered by OpenAI
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
