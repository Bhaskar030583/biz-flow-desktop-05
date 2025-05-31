
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { customer_id, trigger_balance } = await req.json()

    // Get Razorpay credentials from secrets
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured')
    }

    console.log('Processing auto-debit for customer:', customer_id)

    // Get auto-debit config for the customer
    const { data: config, error: configError } = await supabaseClient
      .from('auto_debit_configs')
      .select(`
        *,
        payment_method:customer_payment_methods(*)
      `)
      .eq('customer_id', customer_id)
      .eq('is_enabled', true)
      .single()

    if (configError || !config) {
      console.log('No active auto-debit config found for customer')
      return new Response(
        JSON.stringify({ success: false, message: 'No active auto-debit config' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if trigger amount is reached
    if (trigger_balance < config.trigger_amount) {
      console.log('Trigger amount not reached')
      return new Response(
        JSON.stringify({ success: false, message: 'Trigger amount not reached' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('auto_debit_transactions')
      .insert({
        customer_id: customer_id,
        user_id: config.user_id,
        config_id: config.id,
        amount: config.debit_amount,
        trigger_balance: trigger_balance,
        status: 'pending'
      })
      .select()
      .single()

    if (transactionError) {
      throw new Error('Failed to create transaction record')
    }

    // Process Razorpay payment
    try {
      const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      
      const paymentData = {
        amount: Math.round(config.debit_amount * 100), // Razorpay amount is in paise
        currency: 'INR',
        receipt: `auto_debit_${transaction.id}`,
        payment_capture: 1,
        method: config.payment_method.method_type,
        token: config.payment_method.razorpay_token
      }

      const razorpayResponse = await fetch('https://api.razorpay.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${razorpayAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      })

      const paymentResult = await razorpayResponse.json()

      if (razorpayResponse.ok && paymentResult.status === 'captured') {
        // Payment successful - update transaction
        await supabaseClient
          .from('auto_debit_transactions')
          .update({
            status: 'success',
            razorpay_payment_id: paymentResult.id
          })
          .eq('id', transaction.id)

        // Create credit transaction to reduce customer balance
        await supabaseClient
          .from('credit_transactions')
          .insert({
            customer_id: customer_id,
            user_id: config.user_id,
            amount: -config.debit_amount, // Negative amount to reduce balance
            description: `Auto debit payment - ${paymentResult.id}`,
            status: 'completed'
          })

        console.log('Auto-debit successful for customer:', customer_id)
        return new Response(
          JSON.stringify({ 
            success: true, 
            payment_id: paymentResult.id,
            amount: config.debit_amount
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Payment failed
        await supabaseClient
          .from('auto_debit_transactions')
          .update({
            status: 'failed',
            error_message: paymentResult.error?.description || 'Payment failed'
          })
          .eq('id', transaction.id)

        console.log('Auto-debit failed:', paymentResult.error?.description)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: paymentResult.error?.description || 'Payment failed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (paymentError) {
      // Update transaction with error
      await supabaseClient
        .from('auto_debit_transactions')
        .update({
          status: 'failed',
          error_message: paymentError.message
        })
        .eq('id', transaction.id)

      throw paymentError
    }

  } catch (error) {
    console.error('Auto-debit error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
