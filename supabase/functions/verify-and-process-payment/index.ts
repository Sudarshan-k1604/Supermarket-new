// supabase/functions/verify-and-process-payment/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Razorpay from 'https://esm.sh/razorpay@latest'
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
    const { order_id, cartItems, customer, billData } = await req.json()
    
    if (!order_id) throw new Error('Razorpay Order ID is required.')

    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
    })

    // Ask Razorpay for the status of the order.
    const payments = await razorpay.orders.fetchPayments(order_id)
    const capturedPayment = payments.items.find((p: any) => p.status === 'captured')

    if (!capturedPayment) {
      // PAYMENT NOT DONE YET.
      // Tell the React app the status is 'pending'.
      return new Response(JSON.stringify({ status: 'pending' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ---- PAYMENT IS CONFIRMED! ----
    // Now, we can safely update the database.
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // This single call will update inventory and create the sale record.
    // It's the safest way. Make sure you have this SQL function in your DB.
    const { error: saleError } = await supabaseAdminClient.rpc('process_sale_and_update_inventory', {
        p_cart_items: cartItems,
        p_customer_info: customer,
        p_bill_data: { ...billData, billId: `INV-${order_id}` }, // Use the real order ID for the final bill
        p_payment_details: capturedPayment,
        p_user_id: billData.userId,
    });

    if (saleError) throw saleError
    
    // Tell the React app the payment is successful and send back the final bill data.
    const finalBillData = { ...billData, billId: `INV-${order_id}`, paymentDetails: capturedPayment }

    return new Response(JSON.stringify({ status: 'paid', billData: finalBillData }), {
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