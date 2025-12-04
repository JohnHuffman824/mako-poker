import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card as PokerCard } from "@shared/schema";
import { RANKS, SUITS, SUIT_COLORS, createDeck, cardToString } from "@/lib/poker-logic";
import { cn } from "@/lib/utils";

interface CardSelectorProps {
  value: PokerCard | null;
  onChange: (card: PokerCard | null) => void;
  usedCards?: PokerCard[];
  className?: string;
}

export function CardSelector({ value, onChange, usedCards = [], className }: CardSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const availableCards = createDeck().filter(card => 
    !usedCards.some(used => cardToString(used) === cardToString(card))
  );
  
  const handleCardSelect = (card: PokerCard) => {
    onChange(card);
    setOpen(false);
  };
  
  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-16 h-24 p-0 border-2 border-dashed hover:border-blue-500 transition-colors",
            value ? "border-solid bg-white" : "border-gray-300",
            className
          )}
        >
          {value ? (
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "text-lg font-bold",
                SUIT_COLORS[value.suit] === 'red' ? "text-red-600" : "text-gray-800"
              )}>
                {value.rank}
              </div>
              <div className={cn(
                "text-sm",
                SUIT_COLORS[value.suit] === 'red' ? "text-red-600" : "text-gray-800"
              )}>
                {value.suit}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-xs">
              Select
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Select Card</h4>
            {value && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-13 gap-1">
            {RANKS.map(rank => 
              SUITS.map(suit => {
                const card: PokerCard = { rank, suit, display: rank + suit };
                const isUsed = usedCards.some(used => cardToString(used) === cardToString(card));
                const isSelected = value && cardToString(value) === cardToString(card);
                
                return (
                  <Button
                    key={cardToString(card)}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={isUsed}
                    className={cn(
                      "w-8 h-10 p-0 text-xs",
                      SUIT_COLORS[suit] === 'red' ? "text-red-600" : "text-gray-800",
                      isUsed && "opacity-30 cursor-not-allowed"
                    )}
                    onClick={() => handleCardSelect(card)}
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-xs font-bold">{rank}</div>
                      <div className="text-xs">{suit}</div>
                    </div>
                  </Button>
                );
              })
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {availableCards.length} cards available
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
