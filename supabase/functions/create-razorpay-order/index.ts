// supabase/functions/create-razorpay-order/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Razorpay from 'https://esm.sh/razorpay@latest'

// These headers are required to allow your React app to call this function.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For development. For production, use 'https://your-app-domain.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // This is a required step for CORS to work.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount } = await req.json()

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount provided.')
    }

    // Initialize Razorpay using the secrets you set up in Step 1.
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
    })

    const options = {
      amount: Math.round(amount * 100), // Razorpay requires amount in paise
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
    }

    // Create the order on Razorpay's servers.
    const order = await razorpay.orders.create(options)

    // Send the created order details back to your React app.
    return new Response(JSON.stringify(order), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // If anything goes wrong, send back an error message.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})