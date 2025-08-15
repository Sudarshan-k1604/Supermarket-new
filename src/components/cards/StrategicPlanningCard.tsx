
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface StrategicPlanningCardProps {
  data: {
    total_sales: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
  };
}

export const StrategicPlanningCard: React.FC<StrategicPlanningCardProps> = ({ data }) => {
  const [whatIfScenario, setWhatIfScenario] = useState({
    salesIncrease: 10,
    expenseDecrease: 5,
    priceIncrease: 3
  });

  const calculateWhatIf = () => {
    const newSales = data.total_sales * (1 + whatIfScenario.salesIncrease / 100);
    const newExpenses = data.total_expenses * (1 - whatIfScenario.expenseDecrease / 100);
    const newProfit = newSales - newExpenses;
    const newMargin = (newProfit / newSales) * 100;
    
    return {
      sales: newSales,
      expenses: newExpenses,
      profit: newProfit,
      margin: newMargin,
      profitIncrease: ((newProfit - data.net_profit) / data.net_profit) * 100
    };
  };

  const scenario = calculateWhatIf();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Strategic Planning
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          What-if analysis and long-term planning tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="whatif" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="whatif">What-If Analysis</TabsTrigger>
            <TabsTrigger value="planning">Long-term Goals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="whatif" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-slate-600">Sales Increase %</label>
                <input
                  type="number"
                  value={whatIfScenario.salesIncrease}
                  onChange={(e) => setWhatIfScenario({...whatIfScenario, salesIncrease: Number(e.target.value)})}
                  className="w-full text-xs p-1 border rounded"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Expense Decrease %</label>
                <input
                  type="number"
                  value={whatIfScenario.expenseDecrease}
                  onChange={(e) => setWhatIfScenario({...whatIfScenario, expenseDecrease: Number(e.target.value)})}
                  className="w-full text-xs p-1 border rounded"
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Price Increase %</label>
                <input
                  type="number"
                  value={whatIfScenario.priceIncrease}
                  onChange={(e) => setWhatIfScenario({...whatIfScenario, priceIncrease: Number(e.target.value)})}
                  className="w-full text-xs p-1 border rounded"
                  min="0"
                  max="25"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded border">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Projected Results:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>New Sales: <span className="font-semibold text-green-600">₹{scenario.sales.toLocaleString()}</span></div>
                <div>New Expenses: <span className="font-semibold text-orange-600">₹{scenario.expenses.toLocaleString()}</span></div>
                <div>New Profit: <span className="font-semibold text-green-600">₹{scenario.profit.toLocaleString()}</span></div>
                <div>New Margin: <span className="font-semibold text-blue-600">{scenario.margin.toFixed(1)}%</span></div>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-green-700 font-semibold">
                  Profit Increase: +{scenario.profitIncrease.toFixed(1)}%
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="planning" className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-medium">12-Month Goals</span>
              </div>
              
              <div className="bg-slate-50 p-2 rounded text-xs space-y-1">
                <div>• Revenue Target: ₹{(data.total_sales * 1.3).toLocaleString()} (+30%)</div>
                <div>• Profit Target: ₹{(data.net_profit * 1.5).toLocaleString()} (+50%)</div>
                <div>• Margin Target: {Math.min(data.profit_margin + 5, 35).toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Strategic Initiatives</span>
              </div>
              
              <div className="bg-yellow-50 p-2 rounded text-xs space-y-1">
                <div>• Focus on high-margin products</div>
                <div>• Implement cost reduction program</div>
                <div>• Expand top-performing categories</div>
                <div>• Optimize pricing strategy</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
