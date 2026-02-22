import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function using SHA-256
async function hashCode(code: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { user_id, code } = await req.json();

    if (!user_id || !code) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the latest unused code for this user
    const { data: codeRecord, error: fetchError } = await supabaseAdmin
      .from("two_factor_codes")
      .select("*")
      .eq("user_id", user_id)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !codeRecord) {
      return new Response(
        JSON.stringify({ error: "لا يوجد رمز تحقق صالح. يرجى طلب رمز جديد." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check attempts (max 5)
    if (codeRecord.attempts >= 5) {
      // Mark as used to prevent further attempts
      await supabaseAdmin
        .from("two_factor_codes")
        .update({ used: true })
        .eq("id", codeRecord.id);

      return new Response(
        JSON.stringify({ error: "تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the code
    const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const inputCodeHash = await hashCode(code, salt);

    if (inputCodeHash !== codeRecord.code_hash) {
      // Increment attempts
      await supabaseAdmin
        .from("two_factor_codes")
        .update({ attempts: codeRecord.attempts + 1 })
        .eq("id", codeRecord.id);

      const remainingAttempts = 5 - (codeRecord.attempts + 1);
      return new Response(
        JSON.stringify({ 
          error: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .from("two_factor_codes")
      .update({ used: true })
      .eq("id", codeRecord.id);

    console.log(`2FA verified for user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, message: "تم التحقق بنجاح" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in two-factor-verify:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء التحقق" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
