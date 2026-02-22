import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Same hash function as request
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

interface VerifyBody {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyBody = await req.json();

    if (!email || !code || code.length !== 6) {
      return new Response(
        JSON.stringify({ success: false, error: "بيانات غير صالحة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the reset record
    const { data: resetRecord, error: findError } = await supabaseAdmin
      .from("password_resets")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Error finding reset record:", findError);
      return new Response(
        JSON.stringify({ success: false, error: "حدث خطأ. يرجى المحاولة لاحقاً." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!resetRecord) {
      return new Response(
        JSON.stringify({ success: false, error: "الكود غير صالح أو منتهي الصلاحية" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check max attempts (5 max)
    if (resetRecord.attempts >= 5) {
      // Mark as used to prevent further attempts
      await supabaseAdmin
        .from("password_resets")
        .update({ used: true })
        .eq("id", resetRecord.id);

      return new Response(
        JSON.stringify({ success: false, error: "تم تجاوز عدد المحاولات المسموح. يرجى طلب كود جديد." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Hash the provided code and compare
    const codeHash = await hashCode(code);

    if (codeHash !== resetRecord.code_hash) {
      // Increment attempts
      await supabaseAdmin
        .from("password_resets")
        .update({ attempts: resetRecord.attempts + 1 })
        .eq("id", resetRecord.id);

      const remainingAttempts = 5 - (resetRecord.attempts + 1);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `الكود غير صحيح. المحاولات المتبقية: ${remainingAttempts}` 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Code is correct! Generate a temporary token for password reset
    const resetToken = crypto.randomUUID();
    
    // Update the record with the reset token (reusing code_hash field for simplicity)
    await supabaseAdmin
      .from("password_resets")
      .update({ 
        code_hash: resetToken,
        // Extend expiry for password reset step (5 more minutes)
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      })
      .eq("id", resetRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reset_token: resetToken,
        user_id: resetRecord.user_id,
        message: "تم التحقق بنجاح" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in password-reset-verify:", error);
    return new Response(
      JSON.stringify({ success: false, error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
