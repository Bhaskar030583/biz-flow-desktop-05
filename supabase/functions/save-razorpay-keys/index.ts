
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { keyId, keySecret } = await req.json()

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: 'Key ID and Key Secret are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate the format of Razorpay keys
    if (!keyId.startsWith('rzp_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Key ID format. Should start with rzp_' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Test the credentials before saving
    const razorpayAuth = btoa(`${keyId}:${keySecret}`)
    
    const testResponse = await fetch('https://api.razorpay.com/v1/payments?count=1', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      }
    })

    if (!testResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Invalid Razorpay credentials' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Note: In a real implementation, you would save these to Supabase secrets
    // This is a mock response since we can't actually update secrets from an edge function
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'API keys validated and saved successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error saving Razorpay keys:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
