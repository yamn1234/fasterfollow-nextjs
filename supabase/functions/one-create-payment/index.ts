import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, userId, currency = "USD" } = await req.json();
    
    console.log("Creating ONE payment:", { amount, userId, currency });

    const apiKey = Deno.env.get("ONE_API_KEY");
    const apiSecret = Deno.env.get("ONE_API_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !apiSecret) {
      console.error("ONE API credentials not configured");
      throw new Error("ONE API credentials not configured");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a unique order ID
    const orderId = `${userId}-${Date.now()}`;
    
    // Get the return URL from the request origin or use a default
    const origin = req.headers.get("origin") || "https://fasterfollow.com";
    const successUrl = `${origin}/dashboard?tab=balance&payment=success&gateway=one`;
    const errorUrl = `${origin}/dashboard?tab=balance&payment=cancelled&gateway=one`;
    const webhookUrl = `${supabaseUrl}/functions/v1/one-webhook`;

    console.log("Creating checkout preference with ONE API...");

    // Create checkout preference with ONE API
    const response = await fetch("https://api.one.lat/v1/checkout_preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-api-secret": apiSecret,
      },
      body: JSON.stringify({
        type: "PAYMENT",
        amount: parseFloat(amount),
        currency: currency,
        title: `Deposit ${amount} ${currency}`,
        origin: "API",
        external_id: orderId,
        custom_urls: {
          status_changes_webhook: webhookUrl,
          success_payment_redirect: successUrl,
          error_payment_redirect: errorUrl,
        },
      }),
    });

    const responseText = await response.text();
    console.log("ONE API response status:", response.status);
    console.log("ONE API response:", responseText);

    if (!response.ok) {
      throw new Error(`ONE API error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log("ONE checkout preference created:", result);

    // Create a pending transaction in the database
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "deposit",
        amount: parseFloat(amount),
        payment_method: "one",
        payment_reference: result.id || orderId,
        description: `Deposit via ONE (Visa/Mastercard) - Pending`,
        balance_before: 0,
        balance_after: 0,
      });

    if (transactionError) {
      console.error("Error creating pending transaction:", transactionError);
    }

    return new Response(
      JSON.stringify({
        checkoutUrl: result.checkout_url,
        checkoutId: result.id,
        orderId: orderId,
        status: "created",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating ONE payment:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
