
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface PerformanceScoreCardProps {
  data: {
    total_sales: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
  };
}

export const PerformanceScoreCard: React.FC<PerformanceScoreCardProps> = ({ data }) => {
  const calculateHealthScore = () => {
    let score = 0;
    
    // Profit margin scoring (40 points max)
    if (data.profit_margin >= 25) score += 40;
    else if (data.profit_margin >= 15) score += 30;
    else if (data.profit_margin >= 10) score += 20;
    else if (data.profit_margin >= 5) score += 10;
    
    // Revenue growth (30 points max - simplified for demo)
    if (data.total_sales > 100000) score += 30;
    else if (data.total_sales > 50000) score += 20;
    else if (data.total_sales > 25000) score += 10;
    
    // Expense control (30 points max)
    const expenseRatio = data.total_expenses / data.total_sales;
    if (expenseRatio < 0.6) score += 30;
    else if (expenseRatio < 0.7) score += 20;
    else if (expenseRatio < 0.8) score += 10;
    
    return Math.min(score, 100);
  };

  const healthScore = calculateHealthScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return Target;
    return AlertTriangle;
  };
  
  const ScoreIcon = getScoreIcon(healthScore);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <ScoreIcon className="h-5 w-5" />
          Business Health Score
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Overall performance assessment based on key metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className={`text-4xl font-bold ${getScoreColor(healthScore)}`}>
            {healthScore}
          </div>
          <div className="text-sm text-slate-600">out of 100</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Profitability</span>
            <span className={data.profit_margin >= 15 ? 'text-green-600' : 'text-yellow-600'}>
              {data.profit_margin >= 15 ? '✓ Excellent' : '⚠ Needs Attention'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Revenue Scale</span>
            <span className={data.total_sales > 50000 ? 'text-green-600' : 'text-yellow-600'}>
              {data.total_sales > 50000 ? '✓ Strong' : '⚠ Growing'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Cost Control</span>
            <span className={(data.total_expenses / data.total_sales) < 0.7 ? 'text-green-600' : 'text-yellow-600'}>
              {(data.total_expenses / data.total_sales) < 0.7 ? '✓ Efficient' : '⚠ Monitor'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">
          🎯 <strong>Recommendation:</strong> {
            healthScore >= 80 ? 'Excellent performance! Focus on scaling and expansion.' :
            healthScore >= 60 ? 'Good foundation. Optimize costs and boost margins.' :
            'Critical areas need attention. Review pricing and expenses.'
          }
        </div>
      </CardContent>
    </Card>
  );
};
