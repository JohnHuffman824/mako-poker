import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HandStrength } from "@shared/schema";

interface HandStrengthProps {
  handStrength: HandStrength | null;
  equity: number;
  potOdds: string;
  outs: { count: number; description: string };
}

export function HandStrength({ handStrength, equity, potOdds, outs }: HandStrengthProps) {
  if (!handStrength) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hand Analysis</h3>
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">No hand to analyze</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'from-green-500 to-green-600';
    if (strength >= 0.6) return 'from-yellow-500 to-yellow-600';
    if (strength >= 0.4) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };
  
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'monster': return 'bg-red-100 text-red-800';
      case 'very-strong': return 'bg-orange-100 text-orange-800';
      case 'strong': return 'bg-yellow-100 text-yellow-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'weak': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Hand Analysis</h3>
          <Badge className={getCategoryBadgeColor(handStrength.category)}>
            {handStrength.category}
          </Badge>
        </div>
        
        {/* Hand Strength Meter */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Hand Strength</span>
            <span className="text-sm font-mono font-bold text-blue-600">
              {handStrength.description}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 relative">
            <div 
              className={`bg-gradient-to-r h-3 rounded-full ${getStrengthColor(handStrength.strength)}`}
              style={{ width: `${handStrength.strength * 100}%` }}
            />
            <div 
              className="absolute -top-6 text-xs font-mono text-gray-600"
              style={{ right: `${100 - handStrength.strength * 100}%` }}
            >
              {Math.round(handStrength.strength * 100)}%
            </div>
          </div>
        </div>
        
        {/* Equity vs Range */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 font-mono">
              {Math.round(equity * 100)}%
            </div>
            <div className="text-xs text-gray-600">Equity vs Range</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 font-mono">
              {potOdds}
            </div>
            <div className="text-xs text-gray-600">Pot Odds</div>
          </div>
        </div>
        
        {/* Outs */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-gray-900 mb-1">Outs to Improve</div>
          <div className="text-sm text-gray-600">
            {outs.count} outs - {outs.description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
