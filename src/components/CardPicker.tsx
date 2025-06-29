import React, { useState } from "react";

// Card type definition: rank + suit (e.g., "Ah", "Kd", "Qs", "Tc")
export type Card = `${'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A'}${'h'|'d'|'s'|'c'}`;

// All suits in display order
const allSuits = ['h', 'd', 's', 'c'] as const;

// All ranks in order
const allRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;

/**
 * Convert rank for display (T becomes 10 for better readability)
 */
function getDisplayRank(rank: string): string {
  return rank === 'T' ? '10' : rank;
}

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
 * Renders a 52-card grid organized by suit in vertical columns.
 * Each suit shows cards from 2 to A vertically.
 * Users can select up to 7 cards total (2 hole + 5 community).
 * 
 * Features:
 * - Visual feedback for selected/unselected states
 * - Hover effects and smooth transitions
 * - Mobile-responsive design
 * - Clear All functionality
 * - Accessibility support
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
  const renderCard = (rank: string, suit: string) => {
    const card = `${rank}${suit}` as Card;
    const isSelected = selected.includes(card);
    const isDisabled = selected.length >= 7 && !isSelected;
    const displayRank = getDisplayRank(rank);
    
    return (
      <button
        key={card}
        onClick={() => toggleCard(card)}
        disabled={isDisabled}
        className={`
          w-12 h-16 rounded-lg border-2 shadow-sm p-1 text-center font-bold
          flex flex-col justify-center items-center
          transition-all duration-200 ease-in-out
          ${rank === 'T' ? 'text-xs' : 'text-sm'}
          ${isSelected 
            ? 'bg-green-600 text-white border-green-500 shadow-lg scale-105 ring-2 ring-green-300' 
            : `bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:scale-105 ${getSuitColor(suit)}`
          }
          ${isDisabled 
            ? 'opacity-40 cursor-not-allowed hover:scale-100 hover:shadow-sm' 
            : 'cursor-pointer active:scale-95'
          }
        `}
        aria-pressed={isSelected}
        aria-label={`${displayRank} of ${getSuitName(suit)}`}
        title={`${displayRank}${getSuitSymbol(suit)}`}
      >
        <span className="leading-none font-bold">{displayRank}</span>
        <span className="text-lg leading-none">{getSuitSymbol(suit)}</span>
      </button>
    );
  };

  /**
   * Render suit column with all ranks vertically
   */
  const renderSuitColumn = (suit: string) => (
    <div key={suit} className="flex flex-col items-center">
      {/* Suit header */}
      <div className="mb-3 text-center">
        <div className={`text-xl ${getSuitColor(suit)} bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-gray-200 mb-1`}>
          {getSuitSymbol(suit)}
        </div>
        <div className="text-xs text-white font-bold uppercase tracking-wider">
          {getSuitName(suit)}
        </div>
      </div>
      
      {/* All ranks for this suit vertically */}
      <div className="flex flex-col gap-1">
        {allRanks.map((rank) => (
          <div key={`${rank}-${suit}`}>
            {renderCard(rank, suit)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header with selection count and clear button */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-300">
          <span className="font-medium">Cards Selected: {selected.length}/7</span>
          {selected.length <= 2 && <span className="ml-2 text-blue-400">(Choose hole cards first)</span>}
          {selected.length > 2 && selected.length <= 5 && <span className="ml-2 text-green-400">(Add flop cards)</span>}
          {selected.length > 5 && <span className="ml-2 text-yellow-400">(Add turn/river)</span>}
        </div>
        
        {selected.length > 0 && (
          <button
            onClick={handleClearAll}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Card grid organized by suits in vertical columns */}
      <div className="bg-gray-800 rounded-xl p-4 shadow-inner border-2 border-gray-700">
        <div className="grid grid-cols-4 gap-4 justify-items-center">
          {allSuits.map(suit => renderSuitColumn(suit))}
        </div>
      </div>
      
      {/* Selected cards display */}
      {selected.length > 0 && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm font-medium text-gray-300 mb-3 text-center">Selected Cards</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selected.map((card, index) => {
              const displayRank = getDisplayRank(card[0]);
              const suitSymbol = getSuitSymbol(card[1]);
              const isHoleCard = index < 2;
              
              return (
                <div
                  key={card}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-bold border-2 shadow-sm
                    ${isHoleCard 
                      ? 'bg-blue-600 border-blue-400 text-white' 
                      : 'bg-green-600 border-green-400 text-white'
                    }
                  `}
                >
                  {displayRank}{suitSymbol}
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-gray-400 text-center">
            <span className="inline-flex items-center mr-4">
              <span className="w-3 h-3 bg-blue-600 rounded mr-1"></span>
              Hole Cards
            </span>
            <span className="inline-flex items-center">
              <span className="w-3 h-3 bg-green-600 rounded mr-1"></span>
              Community Cards
            </span>
          </div>
        </div>
      )}
    </div>
  );
}