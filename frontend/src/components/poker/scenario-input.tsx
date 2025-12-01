import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardSelector } from "@/components/ui/card-selector";
import { Card as PokerCard, PokerPosition } from "@shared/schema";
import { Calculator } from "lucide-react";

interface ScenarioInputProps {
  onCalculate: (scenario: PokerScenario) => void;
  isCalculating: boolean;
}

export interface PokerScenario {
  holeCards: PokerCard[];
  communityCards: PokerCard[];
  position: PokerPosition;
  playerCount: number;
  playerStack: number;
  potSize: number;
  blinds: string;
}

export function ScenarioInput({ onCalculate, isCalculating }: ScenarioInputProps) {
  const [holeCards, setHoleCards] = useState<(PokerCard | null)[]>([null, null]);
  const [communityCards, setCommunityCards] = useState<(PokerCard | null)[]>([null, null, null, null, null]);
  const [position, setPosition] = useState<PokerPosition>('BTN');
  const [playerCount, setPlayerCount] = useState(6);
  const [playerStack, setPlayerStack] = useState(2500);
  const [potSize, setPotSize] = useState(150);
  const [blinds, setBlinds] = useState('1/2');
  
  const allSelectedCards = [...holeCards, ...communityCards].filter(Boolean) as PokerCard[];
  
  const handleHoleCardChange = (index: number, card: PokerCard | null) => {
    const newHoleCards = [...holeCards];
    newHoleCards[index] = card;
    setHoleCards(newHoleCards);
  };
  
  const handleCommunityCardChange = (index: number, card: PokerCard | null) => {
    const newCommunityCards = [...communityCards];
    newCommunityCards[index] = card;
    setCommunityCards(newCommunityCards);
  };
  
  const handleCalculate = () => {
    const validHoleCards = holeCards.filter(Boolean) as PokerCard[];
    const validCommunityCards = communityCards.filter(Boolean) as PokerCard[];
    
    if (validHoleCards.length !== 2) {
      alert('Please select both hole cards');
      return;
    }
    
    const scenario: PokerScenario = {
      holeCards: validHoleCards,
      communityCards: validCommunityCards,
      position,
      playerCount,
      playerStack,
      potSize,
      blinds
    };
    
    onCalculate(scenario);
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Scenario</h2>
        
        {/* Hole Cards */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Your Hole Cards
          </Label>
          <div className="flex space-x-2">
            <CardSelector
              value={holeCards[0]}
              onChange={(card) => handleHoleCardChange(0, card)}
              usedCards={allSelectedCards}
            />
            <CardSelector
              value={holeCards[1]}
              onChange={(card) => handleHoleCardChange(1, card)}
              usedCards={allSelectedCards}
            />
          </div>
        </div>
        
        {/* Community Cards */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">
            Community Cards
          </Label>
          <div className="flex space-x-1">
            {communityCards.map((card, index) => (
              <CardSelector
                key={index}
                value={card}
                onChange={(card) => handleCommunityCardChange(index, card)}
                usedCards={allSelectedCards}
                className="w-12 h-18"
              />
            ))}
          </div>
        </div>
        
        {/* Position & Game Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </Label>
            <Select value={position} onValueChange={(value) => setPosition(value as PokerPosition)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTG">UTG</SelectItem>
                <SelectItem value="UTG+1">UTG+1</SelectItem>
                <SelectItem value="MP">Middle Position</SelectItem>
                <SelectItem value="MP+1">MP+1</SelectItem>
                <SelectItem value="CO">Cut-off</SelectItem>
                <SelectItem value="BTN">Button</SelectItem>
                <SelectItem value="SB">Small Blind</SelectItem>
                <SelectItem value="BB">Big Blind</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Players
            </Label>
            <Select value={playerCount.toString()} onValueChange={(value) => setPlayerCount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 Players</SelectItem>
                <SelectItem value="9">9 Players</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Stakes & Stack */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Your Stack
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                className="pl-8"
                placeholder="2,500"
                value={playerStack}
                onChange={(e) => setPlayerStack(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Pot Size
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                className="pl-8"
                placeholder="150"
                value={potSize}
                onChange={(e) => setPotSize(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
        
        {/* Blinds */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Blinds
          </Label>
          <Select value={blinds} onValueChange={setBlinds}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5/1">$0.5/$1</SelectItem>
              <SelectItem value="1/2">$1/$2</SelectItem>
              <SelectItem value="2/5">$2/$5</SelectItem>
              <SelectItem value="5/10">$5/$10</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Action Button */}
        <Button 
          onClick={handleCalculate}
          disabled={isCalculating || holeCards.some(card => !card)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Calculator className="mr-2 h-4 w-4" />
          {isCalculating ? 'Calculating...' : 'Calculate GTO Decision'}
        </Button>
      </CardContent>
    </Card>
  );
}
