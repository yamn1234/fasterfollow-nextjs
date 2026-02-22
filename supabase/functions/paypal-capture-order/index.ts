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
    const { orderId, userId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Capturing PayPal order: ${orderId} for user: ${userId}`);

    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error("PayPal capture error:", captureData);
      return new Response(
        JSON.stringify({ error: "Failed to capture payment", details: captureData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (captureData.status !== "COMPLETED") {
      console.error("Payment not completed:", captureData.status);
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: captureData.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the captured amount
    const capturedAmount = parseFloat(
      captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value || "0"
    );

    console.log(`Payment captured: $${capturedAmount}`);

    // Update user balance in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentBalance = profile.balance || 0;
    const newBalance = currentBalance + capturedAmount;

    // Update balance
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update balance" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the pending transaction
    await supabase
      .from("transactions")
      .update({
        balance_after: newBalance,
        description: `PayPal deposit completed - Order: ${orderId}`,
      })
      .eq("payment_reference", orderId)
      .eq("user_id", userId);

    console.log(`Balance updated for user ${userId}: $${currentBalance} -> $${newBalance}`);

    return new Response(
      JSON.stringify({
        success: true,
        capturedAmount,
        newBalance,
        orderId,
        captureId: captureData.purchase_units[0]?.payments?.captures[0]?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error capturing PayPal order:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
