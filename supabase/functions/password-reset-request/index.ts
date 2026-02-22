import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for OTP code
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Generate 6-digit random code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface RequestBody {
  email: string;
  ip_address?: string;
  user_agent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, ip_address, user_agent }: RequestBody = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: true, message: "إذا كان الإيميل مسجل لدينا، سيتم إرسال كود التحقق" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists (using auth.users via admin API)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      return new Response(
        JSON.stringify({ success: true, message: "إذا كان الإيميل مسجل لدينا، سيتم إرسال كود التحقق" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    // Always return success message (security: don't reveal if email exists)
    if (!user) {
      console.log("User not found for email:", email);
      return new Response(
        JSON.stringify({ success: true, message: "إذا كان الإيميل مسجل لدينا، سيتم إرسال كود التحقق" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting: Check recent requests (max 3 per 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentRequests, error: rateError } = await supabaseAdmin
      .from("password_resets")
      .select("id")
      .eq("email", email.toLowerCase())
      .gte("created_at", fifteenMinutesAgo);

    if (rateError) {
      console.error("Rate limit check error:", rateError);
    }

    if (recentRequests && recentRequests.length >= 3) {
      console.log("Rate limit exceeded for:", email);
      return new Response(
        JSON.stringify({ success: false, error: "تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate OTP and hash it
    const otpCode = generateOTP();
    const codeHash = await hashCode(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unused codes for this email
    await supabaseAdmin
      .from("password_resets")
      .delete()
      .eq("email", email.toLowerCase())
      .eq("used", false);

    // Insert new reset code
    const { error: insertError } = await supabaseAdmin
      .from("password_resets")
      .insert({
        user_id: user.id,
        email: email.toLowerCase(),
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
        ip_address: ip_address || null,
        user_agent: user_agent || null,
      });

    if (insertError) {
      console.error("Error inserting password reset:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "حدث خطأ. يرجى المحاولة لاحقاً." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
        FasterFollow
      </h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
        رمز استعادة كلمة المرور
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; text-align: center;">
        مرحبًا،<br>
        رمز استعادة كلمة المرور الخاص بك هو:
      </p>
      
      <!-- OTP Code Box -->
      <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">🔐 رمز التحقق:</p>
        <div style="font-size: 42px; font-weight: bold; color: #6366f1; letter-spacing: 12px; font-family: monospace;">
          ${otpCode}
        </div>
      </div>
      
      <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
        الرمز صالح لمدة <strong>10 دقائق</strong> فقط.
      </p>
      
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 0 0 20px 0;">
        <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
          ⚠️ إذا لم تطلب استعادة كلمة المرور، يرجى تجاهل هذه الرسالة.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        ${new Date().getFullYear()} © FasterFollow - جميع الحقوق محفوظة
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "FasterFollow <support@fasterfollow.com>",
      to: [email],
      subject: "رمز استعادة كلمة المرور – FasterFollow",
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      // Don't reveal email errors to user
    } else {
      console.log("Password reset email sent to:", email);
    }

    return new Response(
      JSON.stringify({ success: true, message: "إذا كان الإيميل مسجل لدينا، سيتم إرسال كود التحقق" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in password-reset-request:", error);
    return new Response(
      JSON.stringify({ success: false, error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
