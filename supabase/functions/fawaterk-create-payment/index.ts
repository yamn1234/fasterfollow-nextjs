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

        console.log("Creating Fawaterk payment:", { amount, userId, currency });

        const token = Deno.env.get("FAWATERK_API_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!token) {
            console.error("Fawaterk API credentials not configured");
            throw new Error("Fawaterk API credentials not configured");
        }

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Supabase configuration missing");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch user details for the invoice
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", userId)
            .single();

        if (profileError) {
            console.error("Error fetching user profile:", profileError);
            throw new Error("User not found");
        }

        // Get user email from auth
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
        const userEmail = user?.email || "customer@fasterfollow.site";
        const userName = profile?.full_name || "Customer";

        // Generate a unique order ID
        const orderId = `${userId}-${Date.now()}`;

        // Get the return URL from the request origin or use a default
        const origin = req.headers.get("origin") || "https://fasterfollow.site";
        const successUrl = `${origin}/dashboard?tab=balance&payment=success&gateway=fawaterk`;
        const errorUrl = `${origin}/dashboard?tab=balance&payment=cancelled&gateway=fawaterk`;

        console.log("Creating invoice with Fawaterk API...");

        const bodyData = {
            payment_method_id: 2, // 2 is typically the ID for Visa/Mastercard in Fawaterk, adjust if needed
            cartTotal: parseFloat(amount),
            currency: currency,
            customer: {
                first_name: userName.split(' ')[0] || "Customer",
                last_name: userName.split(' ').slice(1).join(' ') || "Name",
                email: userEmail,
                phone: "01000000000" // Required by Fawaterk, using a placeholder if none exists
            },
            redirectionUrls: {
                successUrl: successUrl,
                failUrl: errorUrl,
                pendingUrl: errorUrl
            },
            cartItems: [
                {
                    name: `Deposit ${amount} ${currency}`,
                    price: parseFloat(amount),
                    quantity: 1
                }
            ]
        };

        // Create invoice with Fawaterk API v2
        const response = await fetch("https://app.fawaterk.com/api/v2/invoiceInitPay", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(bodyData),
        });

        const responseText = await response.text();
        console.log("Fawaterk API response status:", response.status);
        console.log("Fawaterk API response:", responseText);

        if (!response.ok) {
            throw new Error(`Fawaterk API error: ${response.status} - ${responseText}`);
        }

        const result = JSON.parse(responseText);

        if (result.status !== "success" || !result.data?.payment_data?.redirectTo) {
            console.error("Invalid Fawaterk response:", result);
            throw new Error("Fawaterk API returned success but missing redirect URL");
        }

        const checkoutUrl = result.data.payment_data.redirectTo;
        const invoiceId = result.data.invoice_id;
        console.log("Fawaterk checkout created, URL:", checkoutUrl, "Invoice ID:", invoiceId);

        // Create a pending transaction in the database
        const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
                user_id: userId,
                type: "deposit",
                amount: parseFloat(amount),
                payment_method: "fawaterk",
                payment_reference: invoiceId.toString(), // Save Fawaterk's invoice ID for webhook matching
                description: `Deposit via Fawaterk (Visa/Mastercard) - Pending`,
                balance_before: 0,
                balance_after: 0,
                status: "pending"
            });

        if (transactionError) {
            console.error("Error creating pending transaction:", transactionError);
        }

        return new Response(
            JSON.stringify({
                checkoutUrl: checkoutUrl,
                checkoutId: invoiceId,
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
        console.error("Error creating Fawaterk payment:", error);
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
