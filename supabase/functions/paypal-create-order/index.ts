import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Use sandbox for testing, live for production
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox";
const PAYPAL_API_URL = PAYPAL_MODE === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal auth error:", error);
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, balanceAmount, userId } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // balanceAmount is the actual amount to add to user's balance (without fees)
    const actualBalanceAmount = balanceAmount || amount;
    
    console.log(`Creating PayPal order for user ${userId}, charge: $${amount}, balance: $${actualBalanceAmount}`);

    const accessToken = await getPayPalAccessToken();

    // Create PayPal order for Smart Payment Buttons
    // Note: Do NOT include payment_source - the JS SDK handles that
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `${userId}-${Date.now()}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
            description: "Account Balance Top-up",
          },
        ],
        // Application context for digital goods - no shipping, no billing address fields
        application_context: {
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "FasterFollow",
          locale: "ar-SA",
        },
        // Pre-fill payer info with default data to minimize form fields
        payer: {
          name: {
            given_name: "Customer",
            surname: "User",
          },
          phone: {
            phone_type: "MOBILE",
            phone_number: {
              national_number: "500000000",
            },
          },
          address: {
            country_code: "SA",
            address_line_1: "Digital Product",
            admin_area_2: "Riyadh",
            admin_area_1: "Riyadh",
            postal_code: "12345",
          },
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error("PayPal order creation error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create PayPal order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderData = await orderResponse.json();
    console.log("PayPal order created:", orderData.id);

    // Store pending transaction in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const currentBalance = profile?.balance || 0;

    // Create pending transaction with the actual balance amount (not the charged amount)
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: actualBalanceAmount,
      balance_before: currentBalance,
      balance_after: currentBalance, // Will be updated on capture
      description: `PayPal deposit - Order: ${orderData.id}`,
      payment_method: "paypal",
      payment_reference: orderData.id,
    });

    // Return order ID for Smart Payment Buttons
    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        status: orderData.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating PayPal order:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
