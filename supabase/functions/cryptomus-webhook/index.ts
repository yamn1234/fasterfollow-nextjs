import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyCryptomusSign(body: object, receivedSign: string, apiKey: string): Promise<boolean> {
  const jsonBody = JSON.stringify(body);
  const base64Body = btoa(jsonBody);
  const signString = base64Body + apiKey;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(signString);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const calculatedSign = new TextDecoder().decode(hexEncode(new Uint8Array(hashBuffer)));
  
  return calculatedSign === receivedSign;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const receivedSign = req.headers.get("sign") || "";
    const apiKey = Deno.env.get("CRYPTOMUS_API_KEY")!;

    console.log("Cryptomus webhook received:", JSON.stringify(body));

    // Verify signature
    const isValid = await verifyCryptomusSign(body, receivedSign, apiKey);
    if (!isValid) {
      console.error("Invalid Cryptomus signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { uuid, order_id, status, amount, additional_data } = body;

    // Only process paid/paid_over status
    const paidStatuses = ["paid", "paid_over"];
    if (!paidStatuses.includes(status)) {
      console.log(`Payment ${uuid} status: ${status} - skipping`);
      return new Response(
        JSON.stringify({ success: true, message: "Status noted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse additional data to get userId
    let userId: string | null = null;
    try {
      const additionalData = JSON.parse(additional_data || "{}");
      userId = additionalData.userId;
    } catch {
      // Try to get from order_id
      userId = order_id?.split("-")[0];
    }

    if (!userId) {
      console.error("Could not determine user ID");
      return new Response(
        JSON.stringify({ error: "User ID not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already processed
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id, balance_after, balance_before")
      .eq("payment_reference", uuid)
      .single();

    if (existingTx && existingTx.balance_after !== existingTx.balance_before) {
      console.log(`Payment ${uuid} already processed`);
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentBalance = Number(profile.balance) || 0;
    const depositAmount = Number(amount);
    const newBalance = currentBalance + depositAmount;

    console.log(`Processing payment: User ${userId}, Amount: $${depositAmount}, Current: $${currentBalance}, New: $${newBalance}`);

    // Update user balance
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

    // Update or create transaction record
    if (existingTx) {
      await supabase
        .from("transactions")
        .update({
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `Cryptomus deposit completed - ${uuid}`,
        })
        .eq("id", existingTx.id);
    } else {
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "deposit",
        amount: depositAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `Cryptomus deposit - ${uuid}`,
        payment_method: "cryptomus",
        payment_reference: uuid,
      });
    }

    console.log(`Payment ${uuid} processed successfully`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Cryptomus webhook error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
