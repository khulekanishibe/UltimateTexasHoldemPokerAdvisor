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
 * Compact CardPicker Component
 * 
 * Optimized for the grid layout with minimal space usage
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
          ${isAce ? 'w-8 h-12' : 'w-7 h-10'} rounded border shadow-sm p-1 text-center font-bold
          flex flex-col justify-center items-center
          transition-all duration-200 ease-in-out
          ${rank === '10' ? 'text-xs' : isAce ? 'text-sm' : 'text-xs'}
          ${isSelected 
            ? `${isAce ? 'bg-yellow-600 border-yellow-500' : 'bg-green-600 border-green-500'} text-white shadow-md scale-105` 
            : `bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm hover:scale-105 ${getSuitColor(suit)}`
          }
          ${isDisabled 
            ? 'opacity-40 cursor-not-allowed hover:scale-100' 
            : 'cursor-pointer active:scale-95'
          }
        `}
        aria-pressed={isSelected}
        aria-label={`${rank} of ${getSuitName(suit)}`}
        title={`${rank}${getSuitSymbol(suit)}`}
      >
        <span className={`leading-none font-bold ${isAce ? 'text-sm' : 'text-xs'}`}>{rank}</span>
        <span className={`${isAce ? 'text-sm' : 'text-xs'} leading-none`}>{getSuitSymbol(suit)}</span>
      </button>
    );
  };

  /**
   * Render compact suit section
   */
  const renderSuitSection = (suit: string) => (
    <div key={suit} className="flex flex-col items-center bg-gray-700/20 rounded-lg p-2">
      {/* Compact suit header */}
      <div className="mb-2 text-center">
        <div className={`text-lg ${getSuitColor(suit)} bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm border mb-1`}>
          {getSuitSymbol(suit)}
        </div>
        <div className="text-xs text-white font-bold uppercase tracking-wider">
          {getSuitName(suit).slice(0, 1)}
        </div>
      </div>
      
      {/* Compact 3×4 Grid */}
      <div className="grid grid-cols-3 gap-1 mb-2">
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
    <div className="w-full h-full">
      {/* Compact selected cards display at top */}
      {selected.length > 0 && (
        <div className="mb-3 p-2 bg-gray-700/30 rounded-lg">
          <div className="flex flex-wrap justify-center gap-1">
            {selected.map((card, index) => {
              const rank = card.slice(0, -1);
              const suit = card.slice(-1);
              const suitSymbol = getSuitSymbol(suit);
              const isHoleCard = index < 2;
              
              return (
                <div
                  key={card}
                  className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${isHoleCard 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white'
                    }
                  `}
                >
                  {rank}{suitSymbol}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Compact card grid organized by suits in 2×2 layout */}
      <div className="bg-gray-800/50 rounded-lg p-2">
        <div className="grid grid-cols-2 gap-2">
          {allSuits.map(suit => renderSuitSection(suit))}
        </div>
      </div>
    </div>
  );
}