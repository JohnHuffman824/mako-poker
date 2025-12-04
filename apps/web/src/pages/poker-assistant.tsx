import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Spade, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScenarioInput, type PokerScenario } from "@/components/poker/scenario-input";
import { GTORecommendation } from "@/components/poker/gto-recommendation";
import { HandStrength } from "@/components/poker/hand-strength";
import { OpponentRange } from "@/components/poker/opponent-range";
import { AdvancedMetrics } from "@/components/poker/advanced-metrics";
import { SessionStats } from "@/components/poker/session-stats";
import { runMonteCarloSimulation } from "@/lib/monte-carlo";
import { evaluateHand, estimateOpponentRange, calculatePotOdds, calculateExpectedValue, calculateOuts } from "@/lib/poker-logic";
import { apiRequest } from "@/lib/queryClient";
import type { GtoRecommendation, Session } from "@shared/schema";

export default function PokerAssistant() {
  const [calculationTime, setCalculationTime] = useState<number>(0);
  const [currentRecommendation, setCurrentRecommendation] = useState<GtoRecommendation | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get or create current session
  const { data: session } = useQuery({
    queryKey: ['/api/session/current'],
    onSuccess: (data) => setCurrentSession(data)
  });
  
  const calculateGTOMutation = useMutation({
    mutationFn: async (scenario: PokerScenario) => {
      const startTime = Date.now();
      
      // Run Monte Carlo simulation
      const monteCarloResult = runMonteCarloSimulation({
        holeCards: scenario.holeCards,
        communityCards: scenario.communityCards,
        opponentCount: scenario.playerCount - 1,
        simulations: 10000
      });
      
      // Evaluate hand strength
      const handStrength = evaluateHand(scenario.holeCards, scenario.communityCards);
      
      // Estimate opponent range
      const opponentRange = estimateOpponentRange(scenario.position, 'raise', scenario.playerCount);
      
      // Calculate pot odds
      const potOdds = calculatePotOdds(scenario.potSize, scenario.potSize * 0.6);
      
      // Calculate expected value
      const expectedValue = calculateExpectedValue(
        monteCarloResult.equity,
        scenario.potSize,
        scenario.potSize * 0.6,
        0.3 // Simplified fold equity
      );
      
      // Determine GTO action based on equity and position
      let recommendedAction = 'fold';
      let actionConfidence = 0;
      let callPercentage = 0;
      let raisePercentage = 0;
      let foldPercentage = 100;
      
      if (monteCarloResult.equity > 0.6) {
        recommendedAction = 'raise';
        actionConfidence = 85;
        raisePercentage = 70;
        callPercentage = 25;
        foldPercentage = 5;
      } else if (monteCarloResult.equity > 0.4) {
        recommendedAction = 'call';
        actionConfidence = 75;
        callPercentage = 65;
        raisePercentage = 22;
        foldPercentage = 13;
      } else {
        recommendedAction = 'fold';
        actionConfidence = 60;
        foldPercentage = 80;
        callPercentage = 15;
        raisePercentage = 5;
      }
      
      const calculationTime = Date.now() - startTime;
      setCalculationTime(calculationTime);
      
      const recommendation: GtoRecommendation = {
        id: 0,
        scenarioId: 0,
        recommendedAction,
        actionConfidence,
        callPercentage,
        raisePercentage,
        foldPercentage,
        recommendedBetSize: scenario.potSize * 0.6,
        potOdds,
        equity: monteCarloResult.equity,
        expectedValue,
        calculationTime,
        createdAt: new Date()
      };
      
      return recommendation;
    },
    onSuccess: (recommendation) => {
      setCurrentRecommendation(recommendation);
      toast({
        title: "GTO Analysis Complete",
        description: `Recommendation: ${recommendation.recommendedAction.toUpperCase()} (${Math.round(recommendation.actionConfidence)}% confidence)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Calculation Error",
        description: "Failed to calculate GTO recommendation. Please try again.",
        variant: "destructive"
      });
      console.error('GTO calculation error:', error);
    }
  });
  
  const handleCalculate = (scenario: PokerScenario) => {
    calculateGTOMutation.mutate(scenario);
  };
  
  const handleQuickCalculate = () => {
    toast({
      title: "Quick Calculate",
      description: "Enter your scenario first to use quick calculate",
    });
  };
  
  // Calculate derived values for display
  const handStrength = currentRecommendation && 
    calculateGTOMutation.variables ? 
    evaluateHand(
      calculateGTOMutation.variables.holeCards, 
      calculateGTOMutation.variables.communityCards
    ) : null;
  
  const outs = currentRecommendation && calculateGTOMutation.variables ?
    calculateOuts(
      calculateGTOMutation.variables.holeCards,
      calculateGTOMutation.variables.communityCards
    ) : { count: 0, description: 'No calculation available' };
  
  const estimatedRange = calculateGTOMutation.variables ?
    estimateOpponentRange(calculateGTOMutation.variables.position, 'raise', calculateGTOMutation.variables.playerCount) :
    [];
  
  const advancedMetrics = currentRecommendation ? {
    expectedValue: currentRecommendation.expectedValue,
    foldEquity: 30, // Simplified
    impliedOdds: currentRecommendation.potOdds,
    reverseImplied: -8.20, // Simplified
    simulations: 10000
  } : null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Spade className="text-blue-600 text-2xl mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Poker GTO Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <Clock className="inline mr-1 h-4 w-4" />
                <span>{calculationTime}ms</span>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <ScenarioInput 
              onCalculate={handleCalculate}
              isCalculating={calculateGTOMutation.isPending}
            />
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Clock className="mr-3 h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Previous Hand</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <span className="mr-3 text-gray-400">📊</span>
                  <span className="text-sm text-gray-700">Save Scenario</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <span className="mr-3 text-gray-400">📥</span>
                  <span className="text-sm text-gray-700">Export Session</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Middle Column: Results & Recommendations */}
          <div className="lg:col-span-1 space-y-6">
            <GTORecommendation 
              recommendation={currentRecommendation}
              isCalculating={calculateGTOMutation.isPending}
            />
            
            <HandStrength
              handStrength={handStrength}
              equity={currentRecommendation?.equity || 0}
              potOdds={currentRecommendation?.potOdds || '0:1'}
              outs={outs}
            />
          </div>
          
          {/* Right Column: Range Analysis & Advanced */}
          <div className="lg:col-span-1 space-y-6">
            <OpponentRange
              estimatedRange={estimatedRange}
              readonly={true}
            />
            
            <AdvancedMetrics metrics={advancedMetrics} />
            
            <SessionStats currentSession={currentSession} />
          </div>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleQuickCalculate}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="sm"
        >
          <Zap className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
