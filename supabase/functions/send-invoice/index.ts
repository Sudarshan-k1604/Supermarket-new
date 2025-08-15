import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
// @ts-ignore
import { Resend } from 'https://esm.sh/resend@3.2.0'

// You must add RESEND_API_KEY to your Supabase project's secrets
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerEmail, customerName, billId, pdfBase64 } = await req.json()

    const { data, error } = await resend.emails.send({
      from: 'Your Store <onboarding@resend.dev>', // Use a verified domain in production
      to: [customerEmail],
      subject: `Your Invoice from Your Store - #${billId}`,
      html: `
        <p>Hi ${customerName},</p>
        <p>Thank you for your purchase! Your invoice is attached.</p>
        <p><strong>Your Store Team</strong></p>
      `,
      attachments: [
        {
          filename: `invoice-${billId}.pdf`,
          content: pdfBase64,
        },
      ],
    })

    if (error) {
      console.error({ error })
      throw error
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})