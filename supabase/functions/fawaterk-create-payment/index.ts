import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FAWATERAK_API_URL = "https://app.fawaterk.com/api/v2";

async function generateHash(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FAWATERAK_API_KEY");
    const providerKey = Deno.env.get("FAWATERAK_PROVIDER_KEY");
    if (!apiKey) {
      throw new Error("Fawaterak API key not configured");
    }

    const { amount, userId, paymentMethodId } = await req.json();

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

    console.log(`Creating Fawaterak payment for user ${userId}, amount: $${amount}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const customerEmail = authUser?.user?.email || "customer@example.com";
    const customerName = authUser?.user?.user_metadata?.full_name || "Customer";

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const currentBalance = profile?.balance || 0;

    const webhookUrl = `${supabaseUrl}/functions/v1/fawaterak-webhook`;

    const requestBody: Record<string, unknown> = {
      payment_method_id: paymentMethodId || 2,
      cartTotal: amount.toFixed(2),
      currency: "USD",
      customer: {
        first_name: customerName.split(" ")[0] || "Customer",
        last_name: customerName.split(" ").slice(1).join(" ") || "User",
        email: customerEmail,
        phone: "0500000000",
        address: "Digital Product",
      },
      redirectionUrls: {
        successUrl: `${webhookUrl}?status=success&userId=${userId}`,
        failUrl: `${webhookUrl}?status=fail&userId=${userId}`,
        pendingUrl: `${webhookUrl}?status=pending&userId=${userId}`,
      },
      cartItems: [
        {
          name: "Account Balance Top-up",
          price: amount.toFixed(2),
          quantity: "1",
        },
      ],
    };

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // Add hash if provider key is available
    if (providerKey) {
      const hash = await generateHash(JSON.stringify(requestBody), providerKey);
      headers["Hash"] = hash;
      console.log("Hash key generated and included in request");
    }

    const paymentRes = await fetch(`${FAWATERAK_API_URL}/invoiceInitPay`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await paymentRes.text();
    console.log("Fawaterak raw response:", responseText);

    let paymentData;
    try {
      paymentData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse Fawaterak response:", responseText);
      throw new Error("Invalid response from Fawaterak");
    }

    if (!paymentRes.ok || paymentData?.status === "error") {
      console.error("Fawaterak payment error:", JSON.stringify(paymentData));
      const errMsg = typeof paymentData?.message === "string"
        ? paymentData.message
        : JSON.stringify(paymentData?.message || "Unknown error");
      return new Response(
        JSON.stringify({ error: `Fawaterak error: ${errMsg}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = paymentData?.data;
    const invoiceId = data?.invoice_id || data?.invoiceId || data?.invoice?.id;
    const paymentUrl = data?.payment_data?.redirectTo ||
      data?.payment_data?.redirect_to ||
      data?.redirectTo ||
      data?.redirect_to ||
      data?.payment_data?.url;

    if (!paymentUrl) {
      console.error("No redirect URL found in response:", JSON.stringify(paymentData));
      throw new Error("No payment URL received from Fawaterak");
    }

    await supabase.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: amount,
      balance_before: currentBalance,
      balance_after: currentBalance,
      description: `Fawaterak deposit - Invoice: ${invoiceId}`,
      payment_method: "fawaterak",
      payment_reference: String(invoiceId),
    });

    console.log(`Fawaterak payment created: invoiceId=${invoiceId}, url=${paymentUrl}`);

    return new Response(
      JSON.stringify({ paymentUrl, invoiceId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating Fawaterak payment:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
