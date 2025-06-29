import React, { useState } from "react";

// Card type definition: rank + suit (e.g., "Ah", "Kd", "Qs")
export type Card = `${'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A'}${'h'|'d'|'s'|'c'}`;

const allRanks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const allSuits = ['h','d','s','c'];

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
}

export default function CardPicker({ onSelect }: CardPickerProps) {
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

  return (
    <div className="w-full max-w-4xl mx-auto">
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
              {/* Suit header */}
              <div className="mb-2 text-center">
                <div className={`text-2xl ${getSuitColor(suit)}`}>
                  {getSuitSymbol(suit)}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {getSuitName(suit)}
                </div>
              </div>
              
              {/* Cards in this suit */}
              {allRanks.map(rank => {
                const card = `${rank}${suit}` as Card;
                const isSelected = selected.includes(card);
                const isDisabled = selected.length >= 7 && !isSelected;
                
                return (
                  <button
                    key={card}
                    onClick={() => toggleCard(card)}
                    disabled={isDisabled}
                    className={`
                      w-14 h-20 rounded border-2 text-lg font-bold 
                      flex flex-col justify-center items-center
                      transition-all duration-200 transform hover:scale-105
                      ${isSelected 
                        ? `bg-white ring-4 ring-green-500 shadow-lg ${getSuitColor(suit)}` 
                        : `bg-white hover:bg-gray-100 border-gray-300 ${getSuitColor(suit)}`
                      }
                      ${isDisabled 
                        ? 'opacity-50 cursor-not-allowed hover:scale-100' 
                        : 'hover:shadow-md cursor-pointer'
                      }
                    `}
                    aria-pressed={isSelected}
                    aria-label={`${rank} of ${getSuitName(suit)}`}
                    title={`${rank}${getSuitSymbol(suit)}`}
                  >
                    <span className="text-sm leading-none">{rank}</span>
                    <span className="text-xl leading-none">{getSuitSymbol(suit)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Selected cards display */}
      {selected.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-300 mb-2">Selected Cards:</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((card, index) => (
              <span 
                key={card}
                className={`
                  px-3 py-1 rounded text-sm font-bold border-2
                  ${index < 2 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-green-600 border-green-400 text-white'
                  }
                  ${getSuitColor(card[1]) === 'text-red-600' ? 'text-red-200' : 'text-white'}
                `}
              >
                {card[0]}{getSuitSymbol(card[1])}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-blue-400">■</span> Hole Cards • 
            <span className="text-green-400">■</span> Community Cards
          </div>
        </div>
      )}
    </div>
  );
}