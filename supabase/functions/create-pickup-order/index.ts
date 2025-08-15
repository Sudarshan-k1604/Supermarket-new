// supabase/functions/create-pickup-order/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cartItems, customer, totalAmount, userId } = await req.json()

    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Insert the order into the new pickup_orders table.
    // We DO NOT touch the inventory table here.
    const { data, error } = await supabaseAdminClient
      .from('pickup_orders')
      .insert({
        user_id: userId,
        customer_info: customer,
        order_items: cartItems,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      throw error
    }
    
    // Return the newly created order data.
    return new Response(JSON.stringify(data), {
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