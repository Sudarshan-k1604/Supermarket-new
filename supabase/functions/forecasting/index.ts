import { corsHeaders } from '../_shared/cors.ts';

// Simple linear regression function (this part is correct and remains)
function linearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n || 0;
  
  return { slope, intercept };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Step 1: Get the sales data from the request body sent by the browser.
    const { salesData } = await req.json();

    // Step 2: Validate the received data.
    if (!salesData || !Array.isArray(salesData) || salesData.length < 2) {
      // If there's not enough data, return a default success response.
      return new Response(JSON.stringify({ historicalData: [], forecastData: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Step 3: Process the provided 'salesData' (no need to fetch from DB).
    const dailySales = new Map<string, number>();
    salesData.forEach(sale => {
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      dailySales.set(date, (dailySales.get(date) || 0) + sale.total_amount);
    });

    const historicalData = Array.from(dailySales.entries()).map(([date, sales], index) => ({
        date,
        sales,
        dayIndex: index,
    }));
    
    const regressionData = historicalData.map(d => ({ x: d.dayIndex, y: d.sales }));
    const { slope, intercept } = linearRegression(regressionData);

    // Step 4: Forecast the next 7 days.
    const lastDay = historicalData[historicalData.length - 1];
    const forecastData = [];
    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = lastDay.dayIndex + i;
        const forecastValue = slope * nextDayIndex + intercept;
        const forecastDate = new Date(lastDay.date);
        forecastDate.setDate(forecastDate.getDate() + i + 1); // Fix date calculation
        
        forecastData.push({
            date: forecastDate.toISOString().split('T')[0],
            forecast: Math.max(0, forecastValue),
        });
    }

    return new Response(JSON.stringify({ historicalData, forecastData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});