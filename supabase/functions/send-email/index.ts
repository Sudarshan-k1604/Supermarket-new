// supabase/functions/send-email/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// This CORS block is essential to prevent the error you saw before.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or your specific app URL for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle the preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, pdfBase64, pdfName } = await req.json()

    // Brevo's API requires a slightly different payload structure.
    const brevoPayload = {
      sender: {
        name: 'Good', // Change this
        email: 'varshanthgen@gmail.com', // IMPORTANT: Change this to your Brevo sender email
      },
      to: [
        {
          email: to,
        },
      ],
      subject: subject,
      htmlContent: html,
      attachment: [
        {
          content: pdfBase64,
          name: pdfName,
        },
      ],
    }

    // Call the Brevo API endpoint
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': Deno.env.get('BREVO_API_KEY')!, // Use the secret you just set
        'content-type': 'application/json',
      },
      body: JSON.stringify(brevoPayload),
    })

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Brevo API Error: ${errorBody.message || response.statusText}`);
    }

    return new Response(JSON.stringify({ message: 'Email sent successfully via Brevo!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})