
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomerData {
  type: string;
  count: number;
}

interface CustomerTrendsChartProps {
  data: CustomerData[];
}

const COLORS = {
  'New': '#3B82F6',
  'Returning': '#10B981'
};

export const CustomerTrendsChart: React.FC<CustomerTrendsChartProps> = ({ data }) => {
  const totalCustomers = data.reduce((sum, item) => sum + item.count, 0);
  
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: ((item.count / totalCustomers) * 100).toFixed(1),
    color: COLORS[item.type as keyof typeof COLORS] || '#64748B'
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-900">{data.type} Customers</p>
          <p className="text-sm text-slate-600">
            Count: <span className="font-semibold">{data.count}</span>
          </p>
          <p className="text-sm text-slate-600">
            Percentage: <span className="font-semibold">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ percentage }: any) => {
    return `${percentage}%`;
  };

  const returningCustomers = dataWithPercentages.find(item => item.type === 'Returning');
  const returningPercentage = returningCustomers ? parseFloat(returningCustomers.percentage) : 0;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-900">{totalCustomers}</div>
        <div className="text-sm text-slate-600">Total Customer Interactions</div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithPercentages}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={70}
              fill="#8884d8"
              dataKey="count"
            >
              {dataWithPercentages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-2">
        {dataWithPercentages.map((item) => (
          <div key={item.type} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-slate-700">{item.type}</span>
            </div>
            <span className="font-semibold">{item.count}</span>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        👥 <strong>Customer Health:</strong> {returningPercentage >= 60 ? 'Excellent customer loyalty! Your retention strategies are working.' :
          returningPercentage >= 40 ? 'Good customer base. Consider loyalty programs to increase retention.' :
          'Focus on customer retention. Implement loyalty rewards and follow-up programs.'}
      </div>
    </div>
  );
};
