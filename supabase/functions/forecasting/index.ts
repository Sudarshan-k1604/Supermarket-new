import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Simple linear regression function
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Get the current user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    // Fetch all historical sales data
    const { data: sales, error } = await supabaseClient
      .from('sales')
      .select('created_at, total_amount')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (sales.length < 2) throw new Error("Not enough sales data for forecasting.");

    // Aggregate sales by day
    const dailySales = new Map<string, number>();
    sales.forEach(sale => {
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      dailySales.set(date, (dailySales.get(date) || 0) + sale.total_amount);
    });

    const historicalData = Array.from(dailySales.entries()).map(([date, sales], index) => ({
        date,
        sales,
        dayIndex: index,
    }));
    
    // Prepare data for regression (x: day index, y: sales amount)
    const regressionData = historicalData.map(d => ({ x: d.dayIndex, y: d.sales }));
    const { slope, intercept } = linearRegression(regressionData);

    // Forecast the next 7 days
    const lastDay = historicalData[historicalData.length - 1];
    const forecastData = [];
    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = lastDay.dayIndex + i;
        const forecastValue = slope * nextDayIndex + intercept;
        const forecastDate = new Date(lastDay.date);
        forecastDate.setDate(forecastDate.getDate() + i);
        
        forecastData.push({
            date: forecastDate.toISOString().split('T')[0],
            forecast: Math.max(0, forecastValue), // Ensure forecast is not negative
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