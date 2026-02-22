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
    const body = await req.json();
    console.log("ONE webhook received:", JSON.stringify(body, null, 2));

    const { event_type, entity_type, entity_id } = body;

    // Only process payment order events
    if (entity_type !== "PAYMENT_ORDER") {
      console.log("Ignoring non-payment order event:", entity_type);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Only process successful payments
    if (event_type !== "PAYMENT_ORDER.CLOSED") {
      console.log("Ignoring non-closed payment event:", event_type);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const apiKey = Deno.env.get("ONE_API_KEY");
    const apiSecret = Deno.env.get("ONE_API_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !apiSecret) {
      throw new Error("ONE API credentials not configured");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    // Get payment order details from ONE API
    console.log("Fetching payment order details from ONE API:", entity_id);
    const orderResponse = await fetch(`https://api.one.lat/v1/payment_orders/${entity_id}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "x-api-secret": apiSecret,
      },
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`Failed to fetch payment order: ${errorText}`);
    }

    const orderData = await orderResponse.json();
    console.log("Payment order details:", JSON.stringify(orderData, null, 2));

    // Check if payment is actually closed/successful
    if (orderData.status !== "CLOSED") {
      console.log("Payment not closed, ignoring:", orderData.status);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const externalId = orderData.external_id;
    const amount = parseFloat(orderData.amount);

    // Extract user ID from external_id (format: userId-timestamp)
    const userId = externalId.split("-")[0];

    console.log("Processing successful payment for user:", userId, "amount:", amount);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's current balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    if (!profile) {
      throw new Error("User profile not found");
    }

    const currentBalance = parseFloat(profile.balance || "0");
    const newBalance = currentBalance + amount;

    console.log("Updating balance:", currentBalance, "->", newBalance);

    // Update user's balance
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      throw new Error("Failed to update user balance");
    }

    // Check if we already have a transaction for this payment
    const { data: existingTransaction } = await supabase
      .from("transactions")
      .select("id")
      .eq("payment_reference", entity_id)
      .eq("type", "deposit")
      .maybeSingle();

    if (existingTransaction) {
      // Update existing transaction
      await supabase
        .from("transactions")
        .update({
          description: `Deposit via ONE (Visa/Mastercard) - Completed`,
          balance_before: currentBalance,
          balance_after: newBalance,
        })
        .eq("id", existingTransaction.id);
    } else {
      // Create a new completed transaction
      await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "deposit",
          amount: amount,
          payment_method: "one",
          payment_reference: entity_id,
          description: `Deposit via ONE (Visa/Mastercard) - Completed`,
          balance_before: currentBalance,
          balance_after: newBalance,
        });
    }

    console.log("Payment processed successfully for user:", userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing ONE webhook:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
