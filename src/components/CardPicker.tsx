import React, { useState } from "react";

// Card type definition: rank + suit (e.g., "Ah", "Kd", "Qs", "10c")
export type Card = string;

// All suits in display order
const allSuits = ['h', 'd', 's', 'c'] as const;

// Ranks arranged in 3×4 grid pattern (excluding Ace)
const gridRanks = [
  ['2', '3', '4'],
  ['5', '6', '7'], 
  ['8', '9', '10'],
  ['J', 'Q', 'K']
];

/**
 * Convert suit letter to Unicode symbol
 */
function getSuitSymbol(suit: string): string {
  const symbols = { h: '♥', d: '♦', s: '♠', c: '♣' };
  return symbols[suit as keyof typeof symbols] || suit;
}

/**
 * Get suit color for visual styling (red for hearts/diamonds, black for spades/clubs)
 */
function getSuitColor(suit: string): string {
  return suit === 'h' || suit === 'd' ? 'text-red-600' : 'text-black';
}

/**
 * Get suit name for accessibility
 */
function getSuitName(suit: string): string {
  const names = { h: 'Hearts', d: 'Diamonds', s: 'Spades', c: 'Clubs' };
  return names[suit as keyof typeof names] || suit;
}

/**
 * CardPicker Props Interface
 */
interface CardPickerProps {
  onSelect: (cards: Card[]) => void;
  selectedCards?: Card[];
}

/**
 * CardPicker Component
 * 
 * Renders cards in a 3×4 grid pattern with Ace prominently placed at bottom center.
 * Each suit is displayed in its own section with this layout.
 * Users can select up to 7 cards total (2 hole + 5 community).
 * 
 * Layout per suit:
 * 2  3  4
 * 5  6  7
 * 8  9  10
 * J  Q  K
 *    A     (centered at bottom)
 */
export default function CardPicker({ onSelect, selectedCards = [] }: CardPickerProps) {
  const [selected, setSelected] = useState<Card[]>(selectedCards);

  /**
   * Toggle card selection state
   */
  const toggleCard = (card: Card) => {
    let newSelection: Card[];
    
    if (selected.includes(card)) {
      // Deselect card
      newSelection = selected.filter(c => c !== card);
    } else {
      // Select card if under limit (7 total: 2 hole + 5 community)
      if (selected.length >= 7) return;
      newSelection = [...selected, card];
    }
    
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
          ${isAce ? 'w-16 h-24' : 'w-14 h-20'} rounded-lg border-2 shadow-sm p-2 text-center font-bold
          flex flex-col justify-center items-center
          transition-all duration-200 ease-in-out
          ${rank === '10' ? 'text-xs' : isAce ? 'text-lg' : 'text-sm'}
          ${isSelected 
            ? `${isAce ? 'bg-yellow-600 border-yellow-500 ring-2 ring-yellow-300' : 'bg-green-600 border-green-500 ring-2 ring-green-300'} text-white shadow-lg scale-105` 
            : `bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:scale-105 ${getSuitColor(suit)}`
          }
          ${isDisabled 
            ? 'opacity-40 cursor-not-allowed hover:scale-100 hover:shadow-sm' 
            : 'cursor-pointer active:scale-95'
          }
          ${isAce ? 'shadow-lg border-4' : ''}
        `}
        aria-pressed={isSelected}
        aria-label={`${rank} of ${getSuitName(suit)}`}
        title={`${rank}${getSuitSymbol(suit)}`}
      >
        <span className={`leading-none font-bold ${isAce ? 'text-xl' : ''}`}>{rank}</span>
        <span className={`${isAce ? 'text-2xl' : 'text-lg'} leading-none`}>{getSuitSymbol(suit)}</span>
      </button>
    );
  };

  /**
   * Render suit section with 3×4 grid + centered Ace
   */
  const renderSuitSection = (suit: string) => (
    <div key={suit} className="flex flex-col items-center bg-gray-700/30 rounded-xl p-4 border border-gray-600">
      {/* Suit header */}
      <div className="mb-4 text-center">
        <div className={`text-2xl ${getSuitColor(suit)} bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-md border-2 border-gray-200 mb-2`}>
          {getSuitSymbol(suit)}
        </div>
        <div className="text-sm text-white font-bold uppercase tracking-wider">
          {getSuitName(suit)}
        </div>
      </div>
      
      {/* 3×4 Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {gridRanks.flat().map((rank) => (
          renderCard(rank, suit)
        ))}
      </div>
      
      {/* Centered Ace at bottom */}
      <div className="flex justify-center">
        {renderCard('A', suit, true)}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header with selection count and clear button */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-300">
          <span className="font-medium">Cards Selected: {selected.length}/7</span>
          {selected.length <= 2 && <span className="ml-2 text-blue-400">(Choose hole cards first)</span>}
          {selected.length > 2 && selected.length <= 5 && <span className="ml-2 text-green-400">(Add flop cards)</span>}
          {selected.length > 5 && <span className="ml-2 text-yellow-400">(Add turn/river)</span>}
        </div>
        
        {selected.length > 0 && (
          <button
            onClick={handleClearAll}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 text-sm shadow-lg hover:shadow-xl"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Card grid organized by suits in 2×2 layout */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-inner border-2 border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {allSuits.map(suit => renderSuitSection(suit))}
        </div>
      </div>
      
      {/* Selected cards display */}
      {selected.length > 0 && (
        <div className="mt-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm font-medium text-gray-300 mb-4 text-center">Selected Cards</p>
          <div className="flex flex-wrap justify-center gap-3">
            {selected.map((card, index) => {
              const rank = card.slice(0, -1);
              const suit = card.slice(-1);
              const suitSymbol = getSuitSymbol(suit);
              const isHoleCard = index < 2;
              const isAce = rank === 'A';
              
              return (
                <div
                  key={card}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-bold border-2 shadow-sm
                    ${isHoleCard 
                      ? 'bg-blue-600 border-blue-400 text-white' 
                      : 'bg-green-600 border-green-400 text-white'
                    }
                    ${isAce ? 'ring-2 ring-yellow-400' : ''}
                  `}
                >
                  {rank}{suitSymbol}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-xs text-gray-400 text-center">
            <span className="inline-flex items-center mr-6">
              <span className="w-3 h-3 bg-blue-600 rounded mr-2"></span>
              Hole Cards
            </span>
            <span className="inline-flex items-center">
              <span className="w-3 h-3 bg-green-600 rounded mr-2"></span>
              Community Cards
            </span>
          </div>
        </div>
      )}
    </div>
  );
}