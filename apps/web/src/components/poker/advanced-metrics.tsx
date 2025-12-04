import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AdvancedMetricsProps {
  metrics: {
    expectedValue: number;
    foldEquity: number;
    impliedOdds: string;
    reverseImplied: number;
    simulations: number;
  } | null;
}

export function AdvancedMetrics({ metrics }: AdvancedMetricsProps) {
  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Metrics</h3>
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Run calculation to see advanced metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrency = (value: number) => {
    return value >= 0 ? `+$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
  };
  
  const getEVColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Metrics</h3>
        
        <div className="space-y-4">
          {/* Expected Value */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Expected Value</span>
              {metrics.expectedValue > 0 ? (
                <TrendingUp className="ml-2 h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="ml-2 h-4 w-4 text-red-600" />
              )}
            </div>
            <span className={`font-mono font-bold ${getEVColor(metrics.expectedValue)}`}>
              {formatCurrency(metrics.expectedValue)}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Fold Equity</span>
            <span className="font-mono font-bold text-gray-700">
              {metrics.foldEquity.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Implied Odds</span>
            <span className="font-mono font-bold text-gray-700">
              {metrics.impliedOdds}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Reverse Implied</span>
            <span className={`font-mono font-bold ${getEVColor(metrics.reverseImplied)}`}>
              {formatCurrency(metrics.reverseImplied)}
            </span>
          </div>
        </div>
        
        {/* Monte Carlo Status */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Monte Carlo Simulation</span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">
                {(metrics.simulations / 1000).toFixed(0)}K iterations
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
