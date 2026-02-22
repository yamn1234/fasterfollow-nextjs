import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

    const { user_id, email } = await req.json();

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: Check recent codes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentCodes } = await supabaseAdmin
      .from("two_factor_codes")
      .select("id")
      .eq("user_id", user_id)
      .gte("created_at", fifteenMinutesAgo);

    if (recentCodes && recentCodes.length >= 5) {
      return new Response(
        JSON.stringify({ error: "تم تجاوز الحد الأقصى للمحاولات. يرجى الانتظار 15 دقيقة." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const codeHash = await hashCode(otpCode, salt);

    // Get IP and User Agent
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      req.headers.get("x-real-ip") || 
                      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Store the code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    await supabaseAdmin.from("two_factor_codes").insert({
      user_id,
      email: email.toLowerCase(),
      code_hash: codeHash,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Send email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FasterFollow</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">رمز التحقق الثنائي</p>
          </div>
          
          <div style="padding: 40px 30px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-bottom: 30px;">
              مرحباً،<br>
              لإكمال تسجيل الدخول، يرجى إدخال رمز التحقق التالي:
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 10px; display: inline-block; margin: 20px 0;">
              ${otpCode}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              ⏱️ الرمز صالح لمدة <strong>10 دقائق</strong>
            </p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 30px; text-align: right;">
              <p style="color: #856404; margin: 0; font-size: 13px;">
                ⚠️ إذا لم تحاول تسجيل الدخول، يرجى تغيير كلمة المرور فوراً لحماية حسابك.
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} FasterFollow. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "FasterFollow <support@fasterfollow.com>",
      to: email.toLowerCase(),
      subject: "رمز التحقق الثنائي – FasterFollow",
      html: emailHtml,
    });

    console.log(`2FA code sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "تم إرسال رمز التحقق" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in two-factor-send:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء إرسال رمز التحقق" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
