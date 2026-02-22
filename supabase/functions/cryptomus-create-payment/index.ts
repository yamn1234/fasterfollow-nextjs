import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CRYPTOMUS_API_URL = "https://api.cryptomus.com/v1";

async function createCryptomusSign(body: object, apiKey: string): Promise<string> {
  const jsonBody = JSON.stringify(body);
  const base64Body = btoa(jsonBody);
  const signString = base64Body + apiKey;
  
  // Use Deno's crypto for MD5
  const encoder = new TextEncoder();
  const data = encoder.encode(signString);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashHex = new TextDecoder().decode(hexEncode(new Uint8Array(hashBuffer)));
  return hashHex;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, userId, currency = "USD" } = await req.json();

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

    const merchantId = Deno.env.get("CRYPTOMUS_MERCHANT_ID");
    const apiKey = Deno.env.get("CRYPTOMUS_API_KEY");

    if (!merchantId || !apiKey) {
      console.error("Cryptomus credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = `${userId}-${Date.now()}`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    
    // Build callback and return URLs
    const callbackUrl = `${supabaseUrl}/functions/v1/cryptomus-webhook`;
    const returnUrl = `${req.headers.get("origin") || "https://fasterfollow.net"}/dashboard?tab=balance&payment=success`;

    console.log(`Creating Cryptomus payment for user ${userId}, amount: $${amount}`);

    const requestBody = {
      amount: amount.toString(),
      currency: currency,
      order_id: orderId,
      url_callback: callbackUrl,
      url_return: returnUrl,
      url_success: returnUrl,
      is_payment_multiple: false,
      lifetime: 3600, // 1 hour
      additional_data: JSON.stringify({ userId }),
    };

    const sign = await createCryptomusSign(requestBody, apiKey);

    const response = await fetch(`${CRYPTOMUS_API_URL}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "merchant": merchantId,
        "sign": sign,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("Cryptomus response:", responseText);

    if (!response.ok) {
      console.error("Cryptomus payment creation error:", responseText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);

    if (!data.result) {
      console.error("Cryptomus error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to create payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store pending transaction in database
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const currentBalance = profile?.balance || 0;

    // Create pending transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: amount,
      balance_before: currentBalance,
      balance_after: currentBalance, // Will be updated on webhook
      description: `Cryptomus deposit - Order: ${orderId}`,
      payment_method: "cryptomus",
      payment_reference: data.result.uuid,
    });

    console.log("Cryptomus payment created:", data.result.uuid);

    return new Response(
      JSON.stringify({
        paymentId: data.result.uuid,
        paymentUrl: data.result.url,
        orderId: orderId,
        status: data.result.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating Cryptomus payment:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
