import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompleteBody {
  email: string;
  reset_token: string;
  new_password: string;
}

// Validate password strength
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "كلمة المرور يجب أن تحتوي على حروف" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "كلمة المرور يجب أن تحتوي على أرقام" };
  }
  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, reset_token, new_password }: CompleteBody = await req.json();

    if (!email || !reset_token || !new_password) {
      return new Response(
        JSON.stringify({ success: false, error: "بيانات غير صالحة" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: passwordValidation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the reset record with matching token
    const { data: resetRecord, error: findError } = await supabaseAdmin
      .from("password_resets")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code_hash", reset_token) // Token is stored in code_hash after verification
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
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
        JSON.stringify({ success: false, error: "جلسة منتهية. يرجى طلب كود جديد." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetRecord.user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "فشل تحديث كلمة المرور. يرجى المحاولة لاحقاً." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark reset record as used
    await supabaseAdmin
      .from("password_resets")
      .update({ used: true })
      .eq("id", resetRecord.id);

    // Send confirmation email
    try {
      await resend.emails.send({
        from: "FasterFollow <support@fasterfollow.com>",
        to: [email],
        subject: "تم تغيير كلمة المرور – FasterFollow",
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
        FasterFollow
      </h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">✓</span>
        </div>
      </div>
      
      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
        تم تغيير كلمة المرور بنجاح
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; text-align: center;">
        تم تغيير كلمة مرور حسابك بنجاح.<br>
        يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
      </p>
      
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 0 0 20px 0;">
        <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
          ⚠️ إذا لم تقم بهذا التغيير، يرجى التواصل معنا فوراً.
        </p>
      </div>
    </div>
    
    <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        ${new Date().getFullYear()} © FasterFollow - جميع الحقوق محفوظة
      </p>
    </div>
  </div>
</body>
</html>
        `,
      });
      console.log("Password change confirmation email sent to:", email);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ success: true, message: "تم تغيير كلمة المرور بنجاح" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in password-reset-complete:", error);
    return new Response(
      JSON.stringify({ success: false, error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
