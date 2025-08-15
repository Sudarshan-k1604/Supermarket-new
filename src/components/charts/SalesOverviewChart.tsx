import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesData {
  date: string;
  total_amount: number;
}

interface SalesOverviewChartProps {
  data: SalesData[];
}

export const SalesOverviewChart: React.FC<SalesOverviewChartProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- CHANGE IS HERE ---
  const formatCurrency = (value: number) => {
    // Replaced '$' with '₹' and used 'en-IN' for Indian number formatting (e.g., 1,00,000)
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-900">{formatDate(label)}</p>
          <p className="text-sm text-blue-600">
            Sales: <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate trend
  const recentSales = data.slice(-7).reduce((sum, item) => sum + item.total_amount, 0);
  const previousSales = data.slice(-14, -7).reduce((sum, item) => sum + item.total_amount, 0);
  const trendPercentage = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* This will now automatically display in Rupees */}
        <div className="text-2xl font-bold text-slate-900">
          {formatCurrency(data.reduce((sum, item) => sum + item.total_amount, 0))}
        </div>
        <div className={`text-sm px-2 py-1 rounded-full ${
          trendPercentage >= 0 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {trendPercentage >= 0 ? '+' : ''}{trendPercentage.toFixed(1)}% vs last week
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            {/* The Y-Axis will now automatically display in Rupees */}
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            {/* The Tooltip will now automatically display in Rupees */}
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="total_amount" 
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#salesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        💡 <strong>Insight:</strong> {trendPercentage >= 10 ? 'Strong sales growth! Consider increasing inventory for popular items.' :
          trendPercentage >= 0 ? 'Steady performance. Look for upselling opportunities.' :
          'Sales declining. Consider promotions or check inventory levels.'}
      </div>
    </div>
  );
};