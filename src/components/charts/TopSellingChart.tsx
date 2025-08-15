
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TopSellingData {
  item_name: string;
  quantity: number;
}

interface TopSellingChartProps {
  data: TopSellingData[];
}

export const TopSellingChart: React.FC<TopSellingChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-sm text-green-600">
            Sold: <span className="font-semibold">{payload[0].value} units</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
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
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="quantity" 
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              name="Quantity Sold"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        💡 <strong>Strategy:</strong> These are your money-makers! Keep them prominently displayed and well-stocked. Consider bundling with slower-moving items.
      </div>
    </div>
  );
};
