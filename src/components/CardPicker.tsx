import React, { useState } from "react";

// Card type definition: rank + suit (e.g., "Ah", "Kd", "Qs", "10c")
export type Card = string;

// All suits in display order
const allSuits = ["h", "d", "s", "c"] as const;

// Ranks arranged in 4×3 grid pattern (excluding Ace)
const gridRanks = [
  ["2", "3", "4", "5"],
  ["6", "7", "8", "9"],
  ["10", "J", "Q", "K"],
];

/**
 * Convert suit letter to Unicode symbol
 */
function getSuitSymbol(suit: string): string {
  const symbols = { h: "♥", d: "���", s: "♠", c: "♣" };
  return symbols[suit as keyof typeof symbols] || suit;
}

/**
 * Get suit color for visual styling (red for hearts/diamonds, black for spades/clubs)
 */
function getSuitColor(suit: string): string {
  return suit === "h" || suit === "d" ? "text-red-600" : "text-black";
}

/**
 * Get suit name for accessibility
 */
function getSuitName(suit: string): string {
  const names = { h: "Hearts", d: "Diamonds", s: "Spades", c: "Clubs" };
  return names[suit as keyof typeof names] || suit;
}

/**
 * CardPicker Props Interface
 */
interface CardPickerProps {
  onSelect: (cards: Card[]) => void;
  selectedCards?: Card[];
  hideSelectedDisplay?: boolean;
}

/**
 * Professional CardPicker Component
 *
 * Features:
 * - Large, clear card buttons with white backgrounds
 * - Organized by suit in vertical columns
 * - Up to 7 card selection (2 hole + 5 community)
 * - Clear visual feedback for selected cards
 * - Individual card removal capability
 * - Responsive design for all screen sizes
 */
export default function CardPicker({
  onSelect,
  selectedCards = [],
  hideSelectedDisplay = false,
}: CardPickerProps) {
  const [selected, setSelected] = useState<Card[]>(selectedCards);

  /**
   * Toggle card selection state
   */
  const toggleCard = (card: Card) => {
    let newSelection: Card[];

    if (selected.includes(card)) {
      // Deselect card
      newSelection = selected.filter((c) => c !== card);
    } else {
      // Select card if under limit (7 total: 2 hole + 5 community)
      if (selected.length >= 7) return;
      newSelection = [...selected, card];
    }

    setSelected(newSelection);
    onSelect(newSelection);
  };

  /**
   * Remove specific card from selection
   */
  const removeCard = (cardToRemove: Card) => {
    const newSelection = selected.filter((c) => c !== cardToRemove);
    setSelected(newSelection);
    onSelect(newSelection);
  };

  /**
   * Clear all selected cards
   */
  const handleClearAll = () => {
    setSelected([]);
    onSelect([]);
  };

  /**
   * Render individual card button
   */
  const renderCard = (rank: string, suit: string, isAce: boolean = false) => {
    const card = `${rank}${suit}`;
    const isSelected = selected.includes(card);
    const isDisabled = selected.length >= 7 && !isSelected;

    return (
      <button
        key={card}
        onClick={() => toggleCard(card)}
        disabled={isDisabled}
        className={`
          ${isAce ? "w-12 h-16" : "w-10 h-14"} rounded-lg border-2 shadow-md p-2 text-center font-bold
          flex flex-col justify-center items-center
          transition-all duration-200 ease-in-out
          ${rank === "10" ? "text-xs" : isAce ? "text-base" : "text-sm"}
          ${
            isSelected
              ? `${isAce ? "bg-yellow-500 border-yellow-400 ring-2 ring-yellow-300" : "bg-green-500 border-green-400 ring-2 ring-green-300"} text-white shadow-xl scale-110 z-10`
              : `bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg hover:scale-105 ${getSuitColor(suit)}`
          }
          ${
            isDisabled
              ? "opacity-40 cursor-not-allowed hover:scale-100 hover:shadow-md"
              : "cursor-pointer active:scale-95"
          }
          ${isAce ? "shadow-lg border-4" : ""}
        `}
        aria-pressed={isSelected}
        aria-label={`${rank} of ${getSuitName(suit)}`}
        title={`${rank}${getSuitSymbol(suit)}`}
      >
        <span className={`leading-none font-bold ${isAce ? "text-lg" : ""}`}>
          {rank}
        </span>
        <span className={`${isAce ? "text-xl" : "text-base"} leading-none`}>
          {getSuitSymbol(suit)}
        </span>
      </button>
    );
  };

  /**
   * Render suit column with 4×3 grid + centered Ace
   */
  const renderSuitColumn = (suit: string) => (
    <div
      key={suit}
      className="flex flex-col items-center bg-gray-700/20 rounded-xl p-3 border border-gray-600"
    >
      {/* Suit header */}
      <div className="mb-3 text-center">
        <div
          className={`text-xl ${getSuitColor(suit)} bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-gray-200 mb-2`}
        >
          {getSuitSymbol(suit)}
        </div>
        <div className="text-xs text-white font-bold uppercase tracking-wider">
          {getSuitName(suit)}
        </div>
      </div>

      {/* 4×3 Grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {gridRanks.flat().map((rank) => renderCard(rank, suit))}
      </div>

      {/* Centered Ace at bottom */}
      <div className="flex justify-center">{renderCard("A", suit, true)}</div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with selection count and clear button */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs text-gray-300">
          <span className="font-medium">Selected: {selected.length}/7</span>
          {selected.length <= 2 && (
            <span className="ml-2 text-blue-400">(Choose hole cards)</span>
          )}
          {selected.length > 2 && selected.length <= 5 && (
            <span className="ml-2 text-green-400">(Add community cards)</span>
          )}
          {selected.length > 5 && (
            <span className="ml-2 text-yellow-400">(Add turn/river)</span>
          )}
        </div>

        {selected.length > 0 && (
          <button
            onClick={handleClearAll}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-medium transition-colors duration-200 text-xs shadow-md hover:shadow-lg"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Selected cards display */}
      {!hideSelectedDisplay && selected.length > 0 && (
        <div className="mb-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
          <p className="text-xs font-medium text-gray-300 mb-2 text-center">
            Selected Cards
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {selected.map((card, index) => {
              const rank = card.slice(0, -1);
              const suit = card.slice(-1);
              const suitSymbol = getSuitSymbol(suit);
              const isHoleCard = index < 2;
              const isAce = rank === "A";

              return (
                <button
                  key={card}
                  onClick={() => removeCard(card)}
                  className={`
                    px-3 py-2 rounded-lg text-xs font-bold border-2 shadow-sm transition-all duration-200
                    hover:scale-105 active:scale-95 cursor-pointer
                    ${
                      isHoleCard
                        ? "bg-blue-600 border-blue-400 text-white hover:bg-blue-700"
                        : "bg-green-600 border-green-400 text-white hover:bg-green-700"
                    }
                    ${isAce ? "ring-2 ring-yellow-400" : ""}
                  `}
                  title={`Remove ${rank}${suitSymbol}`}
                >
                  {rank}
                  {suitSymbol}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-400 text-center">
            <span className="inline-flex items-center mr-4">
              <span className="w-2 h-2 bg-blue-600 rounded mr-1"></span>
              Hole Cards
            </span>
            <span className="inline-flex items-center">
              <span className="w-2 h-2 bg-green-600 rounded mr-1"></span>
              Community Cards
            </span>
          </div>
        </div>
      )}

      {/* Card grid organized by suits in vertical columns */}
      <div className="flex-1 bg-gray-800/50 rounded-xl p-3 border border-gray-700 overflow-auto">
        <div className="grid grid-cols-4 gap-3 h-full">
          {allSuits.map((suit) => renderSuitColumn(suit))}
        </div>
      </div>
    </div>
  );
}
