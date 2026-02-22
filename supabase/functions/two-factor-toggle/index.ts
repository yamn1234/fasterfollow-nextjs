import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false } 
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { enabled } = await req.json();

    if (typeof enabled !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Invalid enabled value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ two_factor_enabled: enabled })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating 2FA status:", updateError);
      return new Response(
        JSON.stringify({ error: "فشل في تحديث إعدادات التحقق الثنائي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`2FA ${enabled ? "enabled" : "disabled"} for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enabled,
        message: enabled ? "تم تفعيل التحقق الثنائي بنجاح" : "تم إلغاء التحقق الثنائي" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in two-factor-toggle:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ في الخادم" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
