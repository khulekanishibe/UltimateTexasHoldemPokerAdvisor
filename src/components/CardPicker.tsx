import React, { useState } from "react";

// Card type definition: rank + suit (e.g., "Ah", "Kd", "Qs")
export type Card = `${'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A'}${'h'|'d'|'s'|'c'}`;

const allRanks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const allSuits = ['h','d','s','c'];

// Convert rank for display (T becomes 10)
function getDisplayRank(rank: string): string {
  return rank === 'T' ? '10' : rank;
}

// Convert suit letter to symbol
function getSuitSymbol(suit: string): string {
  switch (suit) {
    case 'h': return '♥';
    case 'd': return '♦';
    case 's': return '♠';
    case 'c': return '♣';
    default: return '';
  }
}

// Get suit color for visual styling
function getSuitColor(suit: string): string {
  return suit === 'h' || suit === 'd' ? 'text-red-600' : 'text-black';
}

// Get suit name for accessibility
function getSuitName(suit: string): string {
  const names = { h: 'Hearts', d: 'Diamonds', s: 'Spades', c: 'Clubs' };
  return names[suit as keyof typeof names] || suit;
}

/**
 * CardPicker component renders cards organized by suit in 4 columns.
 * Each column represents one suit with ranks from 2 to A.
 * Users can select/deselect cards up to 7 total (2 hole + 5 community).
 * Calls onSelect callback with current selection array whenever cards change.
 */
interface CardPickerProps {
  onSelect: (cards: Card[]) => void;
  onReset: () => void;
}

export default function CardPicker({ onSelect, onReset }: CardPickerProps) {
  const [selected, setSelected] = useState<Card[]>([]);

  const toggleCard = (card: Card) => {
    let newSelection: Card[];
    
    if (selected.includes(card)) {
      // Deselect card
      newSelection = selected.filter(c => c !== card);
    } else {
      // Select card if under limit
      if (selected.length >= 7) return; // Max 7 cards (2 hole + 5 community)
      newSelection = [...selected, card];
    }
    
    setSelected(newSelection);
    onSelect(newSelection);
  };

  const handleReset = () => {
    setSelected([]);
    onSelect([]);
    onReset();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-400">
          Select cards: {selected.length}/7 
          {selected.length <= 2 && " (Choose your hole cards first)"}
          {selected.length > 2 && selected.length <= 5 && " (Add flop cards)"}
          {selected.length > 5 && " (Add turn/river)"}
        </p>
      </div>
      
      {/* Scrollable container for mobile */}
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-4 gap-4 min-w-[320px] p-4 bg-gray-800 rounded-lg">
          {allSuits.map(suit => (
            <div key={suit} className="flex flex-col items-center gap-1">
              {/* Suit header with larger, more prominent styling */}
              <div className="mb-3 text-center">
                <div className={`text-3xl ${getSuitColor(suit)} bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-md`}>
                  {getSuitSymbol(suit)}
                </div>
                <div className="text-xs text-gray-300 font-medium mt-1">
                  {getSuitName(suit)}
                </div>
              </div>
              
              {/* Cards in this suit - larger, more mobile-friendly */}
              {allRanks.map(rank => {
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
                      w-16 h-20 rounded-lg border-2 font-bold p-2
                      flex flex-col justify-center items-center
                      transition-all duration-200 transform hover:scale-105 hover:shadow-md
                      ${rank === 'T' ? 'text-xs' : 'text-base'}
                      ${isSelected 
                        ? `bg-green-600 text-white border-2 border-green-800 shadow-lg` 
                        : `bg-white border-gray-400 hover:bg-gray-50 ${getSuitColor(suit)}`
                      }
                      ${isDisabled 
                        ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none' 
                        : 'cursor-pointer'
                      }
                    `}
                    aria-pressed={isSelected}
                    aria-label={`${displayRank} of ${getSuitName(suit)}`}
                    title={`${displayRank}${getSuitSymbol(suit)}`}
                  >
                    <span className="leading-none">{displayRank}</span>
                    <span className="text-xl leading-none">{getSuitSymbol(suit)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Reset button */}
      <div className="text-center mt-4">
        <button
          onClick={handleReset}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200 font-medium"
          disabled={selected.length === 0}
        >
          Reset Hand
        </button>
      </div>
      
      {/* Selected cards display */}
      {selected.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-300 mb-2">Selected Cards:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selected.map((card, index) => (
              <span 
                key={card}
                className={`
                  px-3 py-1 rounded text-sm font-bold border-2
                  ${index < 2 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-green-600 border-green-400 text-white'
                  }
                `}
              >
                {getDisplayRank(card[0])}{getSuitSymbol(card[1])}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            <span className="text-blue-400">■</span> Hole Cards • 
            <span className="text-green-400">■</span> Community Cards
          </div>
        </div>
      )}
    </div>
  );
}