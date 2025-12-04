import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface GTORecommendationProps {
  recommendation: {
    recommendedAction: string;
    actionConfidence: number;
    callPercentage: number;
    raisePercentage: number;
    foldPercentage: number;
    recommendedBetSize?: number;
    potOdds: string;
    calculationTime: number;
  } | null;
  isCalculating: boolean;
}

export function GTORecommendation({ recommendation, isCalculating }: GTORecommendationProps) {
  if (isCalculating) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">GTO Recommendation</h2>
            <Badge variant="outline" className="text-xs">
              <RotateCcw className="mr-1 h-3 w-3 animate-spin" />
              Calculating
            </Badge>
          </div>
          
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Running Monte Carlo simulation...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!recommendation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">GTO Recommendation</h2>
            <Badge variant="outline" className="text-xs">
              Ready
            </Badge>
          </div>
          
          <div className="flex items-center justify-center h-48">
            <div className="text-center text-gray-500">
              <p>Enter your scenario and click calculate to get GTO recommendations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'call': return 'from-green-500 to-green-600';
      case 'raise': case 'bet': return 'from-orange-500 to-orange-600';
      case 'fold': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };
  
  const getActionBarColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'call': return 'bg-green-500';
      case 'raise': case 'bet': return 'bg-orange-500';
      case 'fold': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const actions = [
    { name: 'Call', percentage: recommendation.callPercentage, color: 'green' },
    { name: 'Raise', percentage: recommendation.raisePercentage, color: 'orange' },
    { name: 'Fold', percentage: recommendation.foldPercentage, color: 'red' }
  ];
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">GTO Recommendation</h2>
          <Badge variant="outline" className="text-xs">
            <RotateCcw className="mr-1 h-3 w-3" />
            {recommendation.calculationTime}ms
          </Badge>
        </div>
        
        {/* Primary Action */}
        <div className="mb-6">
          <div className={cn(
            "bg-gradient-to-r text-white rounded-lg p-4 text-center",
            getActionColor(recommendation.recommendedAction)
          )}>
            <div className="text-2xl font-bold mb-1">
              {recommendation.recommendedAction.toUpperCase()}
            </div>
            <div className="text-sm opacity-90">
              {Math.round(recommendation.actionConfidence)}% Confidence
            </div>
          </div>
        </div>
        
        {/* Action Breakdown */}
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.name}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                action.color === 'green' && "bg-green-50 border-green-200",
                action.color === 'orange' && "bg-orange-50 border-orange-200",
                action.color === 'red' && "bg-red-50 border-red-200"
              )}
            >
              <div className="flex items-center">
                <div className={cn(
                  "w-3 h-3 rounded-full mr-3",
                  action.color === 'green' && "bg-green-500",
                  action.color === 'orange' && "bg-orange-500",
                  action.color === 'red' && "bg-red-500"
                )} />
                <span className="font-medium text-gray-900">{action.name}</span>
              </div>
              <div className="flex items-center">
                <div className="text-sm font-mono text-gray-600 mr-2">
                  {Math.round(action.percentage)}%
                </div>
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      action.color === 'green' && "bg-green-500",
                      action.color === 'orange' && "bg-orange-500",
                      action.color === 'red' && "bg-red-500"
                    )}
                    style={{ width: `${action.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bet Sizing */}
        {recommendation.recommendedBetSize && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-gray-900 mb-2">Optimal Bet Sizing</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recommended</span>
              <span className="font-mono font-bold text-blue-600">
                ${recommendation.recommendedBetSize} ({recommendation.potOdds})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
