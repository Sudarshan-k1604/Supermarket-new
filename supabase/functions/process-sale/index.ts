import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function safely decrements inventory stock.
// Run this in your Supabase SQL Editor ONCE:
/*
  CREATE OR REPLACE FUNCTION decrement_inventory(p_item_id uuid, p_quantity int)
  RETURNS void AS $$
  BEGIN
    UPDATE public.inventory
    SET quantity = quantity - p_quantity
    WHERE id = p_item_id AND quantity >= p_quantity; -- Only update if stock is sufficient
  END;
  $$ LANGUAGE plpgsql;
*/

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role for backend operations
    )
    
    const { billData } = await req.json()

    if (!billData || !billData.items) {
      throw new Error('Missing billData or items in request body');
    }

    // 1. Insert the sale into the 'sales' table
    const { data: saleRecord, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        user_id: billData.userId, // Assuming you add userId to billData
        customer_name: billData.customer.name,
        customer_phone: billData.customer.phone,
        customer_email: billData.customer.email,
        items: billData.items,
        total_amount: billData.finalAmount,
        bill_data: billData,
        payment_status: 'completed',
      })
      .select()
      .single()

    if (saleError) throw saleError

    // 2. Atomically update inventory quantities using the Postgres function
    const inventoryUpdatePromises = billData.items.map(item =>
      supabaseAdmin.rpc('decrement_inventory', {
        p_item_id: item.id,
        p_quantity: item.cart_quantity,
      })
    )
    
    const updateResults = await Promise.all(inventoryUpdatePromises)
    const updateErrors = updateResults.filter(res => res.error);

    if (updateErrors.length > 0) {
      console.error('Inventory update failed for some items:', updateErrors);
      // In a real production app, you might flag this sale for manual review.
    }
    
    return new Response(JSON.stringify({ saleRecord }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})