
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinancialMetrics {
  total_sales: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
}

interface FinancialMetricsCardProps {
  data: FinancialMetrics;
}

export const FinancialMetricsCard: React.FC<FinancialMetricsCardProps> = ({ data }) => {
  const isProfit = data.net_profit >= 0;
  const profitIcon = isProfit ? TrendingUp : TrendingDown;
  const profitColor = isProfit ? 'text-green-600' : 'text-red-600';
  const profitBg = isProfit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <Card className={`${profitBg} border-2`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Health
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Your business performance at a glance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-600">Total Sales</div>
            <div className="text-xl font-bold text-slate-900">
              ${data.total_sales.toLocaleString()}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-slate-600">Total Expenses</div>
            <div className="text-xl font-bold text-slate-900">
              ${data.total_expenses.toLocaleString()}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-slate-600 flex items-center gap-1">
              {React.createElement(profitIcon, { className: `h-4 w-4 ${profitColor}` })}
              Net Profit
            </div>
            <div className={`text-xl font-bold ${profitColor}`}>
              ₹{data.net_profit.toLocaleString()}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-slate-600">Profit Margin</div>
            <div className={`text-xl font-bold ${profitColor}`}>
              {data.profit_margin.toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-slate-600 bg-white p-2 rounded border">
          💼 <strong>Business Health:</strong> {
            data.profit_margin > 20 ? 'Excellent! Your business is very profitable.' :
            data.profit_margin > 10 ? 'Good profitability. Look for growth opportunities.' :
            data.profit_margin > 0 ? 'Breaking even. Focus on reducing costs or increasing sales.' :
            'Urgent: Review expenses and pricing strategy.'
          }
        </div>
      </CardContent>
    </Card>
  );
};
