import React, { useState } from "react";

// Card type definition: rank + suit (e.g., "Ah", "Kd", "Qs")
export type Card = `${'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A'}${'h'|'d'|'s'|'c'}`;

const allSuits = ['h','d','s','c'];

// Organize ranks in 3x4 grid + Ace at bottom center
const rankLayout = [
  ['2', '3', '4'],    // Row 1
  ['5', '6', '7'],    // Row 2  
  ['8', '9', 'T'],    // Row 3
  ['J', 'Q', 'K'],    // Row 4
  // Ace will be positioned separately at bottom center
];

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
 * Each suit shows cards in a 3x4 grid with Ace at the bottom center.
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
          w-12 h-12 rounded-lg border shadow-sm p-2 text-center text-lg font-bold
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
        <span className="leading-none">{displayRank}</span>
        <span className="text-base leading-none">{getSuitSymbol(suit)}</span>
      </button>
    );
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
      
      {/* Card grid organized by suits */}
      <div className="overflow-x-auto pb-4">
        <div className="flex flex-wrap justify-start gap-1 min-w-[320px] p-4 bg-gray-800 rounded-lg">
          {allSuits.map(suit => (
            <div key={suit} className="flex flex-col items-center mb-4 mx-2">
              {/* Suit header */}
              <div className="mb-3 text-center">
                <div className={`text-xl ${getSuitColor(suit)} bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm mb-1`}>
                  {getSuitSymbol(suit)}
                </div>
                <div className="text-xs text-gray-300 font-medium">
                  {getSuitSymbol(suit)}
                </div>
              </div>
              
              {/* 3x4 Grid of cards (2-K) */}
              <div className="grid grid-cols-3 gap-1 mb-2">
                {rankLayout.map((row, rowIndex) => 
                  row.map((rank) => (
                    <div key={`${rank}-${suit}`}>
                      {renderCard(rank, suit)}
                    </div>
                  ))
                )}
              </div>
              
              {/* Ace at bottom center */}
              <div className="flex justify-center">
                {renderCard('A', suit)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Reset button */}
      <div className="text-center mt-3">
        <button
          onClick={handleReset}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-3 transition-colors duration-200 font-medium"
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