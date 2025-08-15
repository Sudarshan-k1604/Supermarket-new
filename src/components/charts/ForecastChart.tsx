
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ForecastChartProps {
  data: number[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  const forecastData = data.map((value, index) => ({
    day: `Day ${index + 1}`,
    forecast: Math.round(value),
    dayLabel: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `Day ${index + 1}`
  }));

  const totalForecast = forecastData.reduce((sum, item) => sum + item.forecast, 0);
  const averageDaily = totalForecast / forecastData.length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-900">{payload[0].payload.dayLabel}</p>
          <p className="text-sm text-purple-600">
            Predicted Sales: <span className="font-semibold">{payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-lg font-semibold text-slate-900">
            ₹{totalForecast.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Predicted Total</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-purple-600">
            ₹{Math.round(averageDaily).toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Daily Average</div>
        </div>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="dayLabel" 
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(value) => `₹${value}`}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={averageDaily} 
              stroke="#94A3B8" 
              strokeDasharray="5 5"
              label={{ value: "Average", position: "top", fontSize: 12 }}
            />
            <Line 
              type="monotone" 
              dataKey="forecast" 
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        🔮 <strong>AI Forecast:</strong> Based on historical patterns, plan for approximately ₹{Math.round(averageDaily).toLocaleString()} in daily sales. 
        Stock up before weekend peaks and ensure adequate staffing.
      </div>
    </div>
  );
};
