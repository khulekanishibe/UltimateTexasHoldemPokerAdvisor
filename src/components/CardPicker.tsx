import React, { useState } from "react";

// Card type definition: rank + suit (e.g., "Ah", "Kd", "Qs")
export type Card = `${'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A'}${'h'|'d'|'s'|'c'}`;

const allRanks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const allSuits = ['h','d','s','c'];

// Generate complete 52-card deck
function generateDeck(): Card[] {
  return allRanks.flatMap(r => allSuits.map(s => `${r}${s}` as Card));
}

// Get suit color for visual styling
function getSuitColor(suit: string): string {
  return suit === 'h' || suit === 'd' ? 'text-red-400' : 'text-gray-200';
}

// Convert suit letter to symbol
function getSuitSymbol(suit: string): string {
  const symbols = { h: '♥', d: '♦', s: '♠', c: '♣' };
  return symbols[suit as keyof typeof symbols] || suit;
}

/**
 * CardPicker component renders a grid of all 52 cards as clickable buttons.
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
      
      <div className="grid grid-cols-13 gap-1 p-4 bg-gray-800 rounded-lg">
        {generateDeck().map(card => {
          const rank = card[0];
          const suit = card[1];
          const isSelected = selected.includes(card);
          
          return (
            <button
              key={card}
              className={`
                aspect-[2/3] p-1 border rounded-md font-mono text-xs font-bold
                transition-all duration-200 transform hover:scale-105
                ${isSelected 
                  ? "bg-green-600 border-green-400 text-white shadow-lg" 
                  : "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
                }
                ${getSuitColor(suit)}
              `}
              onClick={() => toggleCard(card)}
              disabled={selected.length >= 7 && !isSelected}
              aria-pressed={isSelected}
              title={`${rank}${getSuitSymbol(suit)}`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-xs">{rank}</span>
                <span className="text-lg leading-none">{getSuitSymbol(suit)}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      {selected.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-300 mb-2">Selected Cards:</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((card, index) => (
              <span 
                key={card}
                className={`
                  px-2 py-1 rounded text-sm font-mono font-bold
                  ${index < 2 ? 'bg-blue-600' : 'bg-green-600'}
                  ${getSuitColor(card[1])}
                `}
              >
                {card[0]}{getSuitSymbol(card[1])}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}