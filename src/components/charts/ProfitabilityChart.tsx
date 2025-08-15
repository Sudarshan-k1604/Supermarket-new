
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfitData {
  item_name: string;
  profit: number;
}

interface ProfitabilityChartProps {
  data: ProfitData[];
}

export const ProfitabilityChart: React.FC<ProfitabilityChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-sm text-green-600">
            Profit: <span className="font-semibold">${payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="space-y-4">
      <div className="text-right text-sm text-slate-600">
        Total Profit: <span className="font-semibold text-green-600">₹{totalProfit.toLocaleString()}</span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="item_name" 
              tick={{ fontSize: 10, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tickFormatter={(value) => `₹${value}`}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="profit" 
              fill="#059669"
              radius={[4, 4, 0, 0]}
              name="Profit"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        💰 <strong>Profit Focus:</strong> These items generate the most profit per sale. Promote them heavily and ensure competitive pricing on similar products.
      </div>
    </div>
  );
};
