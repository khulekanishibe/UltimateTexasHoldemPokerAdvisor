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
 * Each suit shows all 13 cards in a vertical column.
 * Users can select/deselect cards up to 7 total (2 hole + 5 community).
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

  // Render individual card button
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
          w-14 h-20 rounded-lg border shadow-sm p-3 text-center font-bold
          flex flex-col justify-center items-center
          transition duration-150 ease-in-out hover:shadow-lg hover:scale-105
          ${rank === 'T' ? 'text-sm' : 'text-lg'}
          ${isSelected 
            ? `bg-green-700 text-white border-green-800 shadow-md scale-105` 
            : `bg-white border-gray-400 hover:bg-gray-50 ${getSuitColor(suit)}`
          }
          ${isDisabled 
            ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-sm' 
            : 'cursor-pointer'
          }
        `}
        aria-pressed={isSelected}
        aria-label={`${displayRank} of ${getSuitName(suit)}`}
        title={`${displayRank}${getSuitSymbol(suit)}`}
      >
        <span className="leading-none mb-1">{displayRank}</span>
        <span className="text-xl leading-none">{getSuitSymbol(suit)}</span>
      </button>
    );
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
      
      {/* Card grid organized by suits */}
      <div className="overflow-x-auto pb-4">
        <div className="flex justify-center gap-4 min-w-[320px] p-6 bg-gray-800 rounded-lg">
          {allSuits.map(suit => (
            <div key={suit} className="flex flex-col items-center">
              {/* Suit header */}
              <div className="mb-4 text-center">
                <div className={`text-2xl ${getSuitColor(suit)} bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm mb-2`}>
                  {getSuitSymbol(suit)}
                </div>
                <div className="text-xs text-gray-300 font-medium">
                  {getSuitName(suit)}
                </div>
              </div>
              
              {/* All cards in this suit */}
              <div className="flex flex-col gap-2">
                {allRanks.map((rank) => (
                  <div key={`${rank}-${suit}`}>
                    {renderCard(rank, suit)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Reset button */}
      <div className="text-center mt-4">
        <button
          onClick={handleReset}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
          disabled={selected.length === 0}
        >
          Reset Hand
        </button>
      </div>
      
      {/* Selected cards display */}
      {selected.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-300 mb-3">Selected Cards:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {selected.map((card, index) => (
              <span 
                key={card}
                className={`
                  px-3 py-2 rounded-lg text-sm font-bold border-2 shadow-sm
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
          <div className="mt-3 text-xs text-gray-500 text-center">
            <span className="text-blue-400">■</span> Hole Cards • 
            <span className="text-green-400">■</span> Community Cards
          </div>
        </div>
      )}
    </div>
  );
}