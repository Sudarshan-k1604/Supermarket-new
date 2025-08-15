
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExpenseData {
  category: string;
  amount: number;
}

interface ExpenseBreakdownChartProps {
  data: ExpenseData[];
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#84CC16', '#EC4899'
];

export const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ data }) => {
  const totalExpenses = data.reduce((sum, item) => sum + item.amount, 0);
  
  const dataWithPercentages = data.map((item, index) => ({
    ...item,
    percentage: ((item.amount / totalExpenses) * 100).toFixed(1),
    percentageNumber: (item.amount / totalExpenses) * 100,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-900">{data.category}</p>
          <p className="text-sm text-slate-600">
            Amount: <span className="font-semibold">${data.amount.toLocaleString()}</span>
          </p>
          <p className="text-sm text-slate-600">
            Share: <span className="font-semibold">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ percentage }: any) => {
    return `${percentage}%`;
  };

  const largestExpense = dataWithPercentages.reduce((max, item) => 
    item.amount > max.amount ? item : max, dataWithPercentages[0]);

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithPercentages}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
            >
              {dataWithPercentages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {dataWithPercentages.map((item, index) => (
          <div key={item.category} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-slate-600 truncate">
              {item.category}: ₹{item.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        💡 <strong>Cost Control:</strong> {largestExpense.category} is your biggest expense at {largestExpense.percentage}% of total costs. 
        {largestExpense.percentageNumber > 40 ? ' Consider if this can be optimized.' : ' This seems reasonable.'}
      </div>
    </div>
  );
};
