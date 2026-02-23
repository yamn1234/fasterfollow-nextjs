import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the frontend URL for redirects
    const siteUrl = Deno.env.get("SITE_URL") || "https://fasterfollow.net";

    // Handle GET redirect from Fawaterak (success/fail/pending redirects)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      const userId = url.searchParams.get("userId");
      const invoiceId = url.searchParams.get("invoice_id") || url.searchParams.get("fawaterak_invoice_id");

      console.log(`Fawaterak redirect: status=${status}, userId=${userId}, invoiceId=${invoiceId}`);

      if (status === "success" && userId && invoiceId) {
        // Verify payment with Fawaterak API
        const apiKey = Deno.env.get("FAWATERAK_API_KEY");
        if (apiKey) {
          try {
            const verifyRes = await fetch(
              `https://app.fawaterk.com/api/v2/getInvoiceData/${invoiceId}`,
              {
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
              }
            );

            const verifyData = await verifyRes.json();
            console.log("Invoice verification:", JSON.stringify(verifyData));

            const invoiceStatus = verifyData?.data?.invoice_status;
            const apiStatus = verifyData?.data?.status;
            const statusText = verifyData?.data?.status_text;

            if (invoiceStatus === "paid" || apiStatus === "paid" || apiStatus === 1 || statusText === "paid") {
              // Find the transaction to get the exact USD amount
              const { data: transaction } = await supabase
                .from("transactions")
                .select("*")
                .eq("payment_reference", String(invoiceId))
                .eq("payment_method", "fawaterak")
                .single();

              if (transaction && transaction.balance_after === transaction.balance_before) {
                const baseAmount = Number(transaction.amount);

                // Fetch gateway config for bonus
                const { data: gateways } = await supabase
                  .from("payment_gateways")
                  .select("bonus_percentage")
                  .eq("slug", "fawaterak")
                  .eq("is_active", true);

                const bonusPercentage = gateways && gateways.length > 0 ? (gateways[0].bonus_percentage || 0) : 0;
                const bonusAmount = baseAmount * (bonusPercentage / 100);
                const totalAmountToAdd = baseAmount + bonusAmount;

                // Get current balance
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("balance")
                  .eq("user_id", transaction.user_id)
                  .single();

                const currentBalance = Number(profile?.balance || 0);
                const newBalance = currentBalance + totalAmountToAdd;

                // Update balance
                await supabase
                  .from("profiles")
                  .update({ balance: newBalance })
                  .eq("user_id", transaction.user_id);

                // Update transaction
                await supabase
                  .from("transactions")
                  .update({
                    balance_after: newBalance,
                    description: `Fawaterak deposit completed - Invoice: ${invoiceId} (Bonus: $${bonusAmount.toFixed(2)})`,
                  })
                  .eq("id", transaction.id);

                console.log(`Balance updated for user ${transaction.user_id}: $${currentBalance} -> $${newBalance} (including $${bonusAmount} bonus)`);
              }
            }
          } catch (verifyError) {
            console.error("Error verifying Fawaterak payment:", verifyError);
          }
        }

        // Redirect to dashboard with success
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${siteUrl}/dashboard?tab=balance&payment=success`,
          },
        });
      }

      // Failed or pending
      const redirectStatus = status === "pending" ? "pending" : "failed";
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${siteUrl}/dashboard?tab=balance&payment=${redirectStatus}`,
        },
      });
    }

    // Handle POST webhook from Fawaterak
    if (req.method === "POST") {
      const body = await req.json();
      console.log("Fawaterak webhook received:", JSON.stringify(body));

      const invoiceId = body.invoice_id || body.InvoiceId;
      const status = body.payment_status || body.invoice_status || body.status;
      const statusText = body.status_text;

      if ((status === "paid" || status === 1 || statusText === "paid") && invoiceId) {
        // Find the transaction
        const { data: transaction } = await supabase
          .from("transactions")
          .select("*")
          .eq("payment_reference", String(invoiceId))
          .eq("payment_method", "fawaterak")
          .single();

        if (transaction && transaction.balance_after === transaction.balance_before) {
          const baseAmount = Number(transaction.amount);

          // Fetch gateway config for bonus
          const { data: gateways } = await supabase
            .from("payment_gateways")
            .select("bonus_percentage")
            .eq("slug", "fawaterak")
            .eq("is_active", true);

          const bonusPercentage = gateways && gateways.length > 0 ? (gateways[0].bonus_percentage || 0) : 0;
          const bonusAmount = baseAmount * (bonusPercentage / 100);
          const totalAmountToAdd = baseAmount + bonusAmount;

          // Payment not yet processed
          const { data: profile } = await supabase
            .from("profiles")
            .select("balance")
            .eq("user_id", transaction.user_id)
            .single();

          const currentBalance = Number(profile?.balance || 0);
          const newBalance = currentBalance + totalAmountToAdd;

          await supabase
            .from("profiles")
            .update({ balance: newBalance })
            .eq("user_id", transaction.user_id);

          await supabase
            .from("transactions")
            .update({
              balance_after: newBalance,
              description: `Fawaterak deposit completed - Invoice: ${invoiceId} (Bonus: $${bonusAmount.toFixed(2)})`,
            })
            .eq("id", transaction.id);

          console.log(`Webhook: Balance updated for user ${transaction.user_id}: $${currentBalance} -> $${newBalance} (including $${bonusAmount} bonus)`);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: unknown) {
    console.error("Fawaterak webhook error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
