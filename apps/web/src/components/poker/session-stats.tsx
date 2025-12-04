import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@shared/schema";

interface SessionStatsProps {
  currentSession: Session | null;
}

export function SessionStats({ currentSession }: SessionStatsProps) {
  const { data: sessionData } = useQuery({
    queryKey: ['/api/session/current'],
    enabled: !currentSession
  });
  
  const session = currentSession || sessionData;
  
  if (!session) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Statistics</h3>
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">No active session</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getGTOAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return 'bg-green-500';
    if (adherence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-700';
    if (pnl < 0) return 'text-red-700';
    return 'text-gray-700';
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Statistics</h3>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-lg font-bold text-green-700 font-mono">
              {session.handsPlayed || 0}
            </div>
            <div className="text-xs text-green-600">Hands Played</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className={`text-lg font-bold font-mono ${getPnLColor(session.sessionPnL || 0)}`}>
              {session.sessionPnL && session.sessionPnL >= 0 ? '+' : ''}
              ${(session.sessionPnL || 0).toFixed(0)}
            </div>
            <div className="text-xs text-blue-600">Session P&L</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-xs font-medium text-gray-700 mb-1">GTO Adherence</div>
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
              <div
                className={`h-2 rounded-full ${getGTOAdherenceColor(session.gtoAdherence || 0)}`}
                style={{ width: `${session.gtoAdherence || 0}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-600">
              {(session.gtoAdherence || 0).toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
