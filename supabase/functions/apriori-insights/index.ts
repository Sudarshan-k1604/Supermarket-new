import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Simplified function to find product pairs that are frequently bought together
function findFrequentPairs(sales: { items: any[] }[]) {
    const itemCounts = new Map<string, number>();
    const pairCounts = new Map<string, number>();

    for (const sale of sales) {
        // Ensure items are properly parsed
        let items = [];
        if (Array.isArray(sale.items)) {
            items = sale.items;
        } else if (typeof sale.items === 'string') {
            try { items = JSON.parse(sale.items); } catch { items = []; }
        }
        
        const productNames = items.map(item => item.item_name).sort();

        // Count individual items and pairs
        for (let i = 0; i < productNames.length; i++) {
            const name = productNames[i];
            itemCounts.set(name, (itemCounts.get(name) || 0) + 1);

            for (let j = i + 1; j < productNames.length; j++) {
                const pairKey = `${productNames[i]} | ${productNames[j]}`;
                pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
            }
        }
    }
    
    const rules = [];
    for (const [pairKey, pairCount] of pairCounts.entries()) {
        if (pairCount < 2) continue; // Minimum support: must be bought together at least twice
        
        const [itemA, itemB] = pairKey.split(' | ');
        const confidenceAtoB = pairCount / itemCounts.get(itemA)!;
        const confidenceBtoA = pairCount / itemCounts.get(itemB)!;

        // Add rule if confidence is over 50%
        if (confidenceAtoB > 0.5) {
            rules.push({ antecedent: itemA, consequent: itemB, confidence: confidenceAtoB });
        }
        if (confidenceBtoA > 0.5) {
            rules.push({ antecedent: itemB, consequent: itemA, confidence: confidenceBtoA });
        }
    }

    // Return the top 3 strongest rules
    return rules.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
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
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    const { data: sales, error } = await supabaseClient
      .from('sales')
      .select('items')
      .eq('user_id', user.id)
      .limit(500); // Analyze the last 500 sales for performance

    if (error) throw error;
    
    const insights = findFrequentPairs(sales);

    return new Response(JSON.stringify({ insights }), {
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