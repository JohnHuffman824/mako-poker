import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RangeGridProps {
  selectedHands: string[];
  onHandToggle: (hand: string) => void;
  readonly?: boolean;
  className?: string;
}

// Generate all possible poker hands
function generateHandMatrix(): string[][] {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const matrix: string[][] = [];
  
  for (let i = 0; i < ranks.length; i++) {
    const row: string[] = [];
    for (let j = 0; j < ranks.length; j++) {
      const rank1 = ranks[i];
      const rank2 = ranks[j];
      
      if (i === j) {
        // Pocket pairs
        row.push(`${rank1}${rank2}`);
      } else if (i < j) {
        // Suited hands (above diagonal)
        row.push(`${rank1}${rank2}s`);
      } else {
        // Offsuit hands (below diagonal)
        row.push(`${rank1}${rank2}o`);
      }
    }
    matrix.push(row);
  }
  
  return matrix;
}

export function RangeGrid({ selectedHands, onHandToggle, readonly = false, className }: RangeGridProps) {
  const [hoveredHand, setHoveredHand] = useState<string | null>(null);
  const handMatrix = generateHandMatrix();
  
  const getHandColor = (hand: string): string => {
    if (selectedHands.includes(hand)) {
      if (hand.includes('A') || hand.includes('K')) return 'bg-red-200 border-red-300';
      if (hand.includes('Q') || hand.includes('J')) return 'bg-orange-200 border-orange-300';
      if (hand.includes('T') || hand.includes('9')) return 'bg-yellow-200 border-yellow-300';
      return 'bg-green-200 border-green-300';
    }
    return 'bg-gray-100 border-gray-300';
  };
  
  const handleHandClick = (hand: string) => {
    if (!readonly) {
      onHandToggle(hand);
    }
  };
  
  return (
    <div className={cn("inline-block", className)}>
      <div className="grid grid-cols-13 gap-0.5">
        {handMatrix.map((row, rowIndex) =>
          row.map((hand, colIndex) => (
            <Button
              key={`${rowIndex}-${colIndex}`}
              variant="outline"
              size="sm"
              disabled={readonly}
              className={cn(
                "w-6 h-6 p-0 text-xs font-bold transition-all duration-200",
                getHandColor(hand),
                hoveredHand === hand && "scale-110 z-10 shadow-md",
                !readonly && "cursor-pointer hover:scale-105"
              )}
              onClick={() => handleHandClick(hand)}
              onMouseEnter={() => setHoveredHand(hand)}
              onMouseLeave={() => setHoveredHand(null)}
            >
              {hand.replace('o', '').replace('s', '')}
            </Button>
          ))
        )}
      </div>
      
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Pairs on diagonal</span>
        <span>Suited above, offsuit below</span>
      </div>
    </div>
  );
}
