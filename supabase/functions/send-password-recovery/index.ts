import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordRecoveryRequest {
  email: string;
  otpCode: string;
  siteName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otpCode, siteName = "Faster Follow" }: PasswordRecoveryRequest = await req.json();

    console.log(`Sending password recovery email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: `${siteName} <support@fasterfollow.com>`,
      to: [email],
      subject: `كود استعادة كلمة المرور - ${siteName}`,
      html: `
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
                ${siteName}
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
                استعادة كلمة المرور
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; text-align: center;">
                لقد طلبت استعادة كلمة المرور لحسابك. استخدم الكود التالي لإعادة تعيين كلمة المرور:
              </p>
              
              <!-- OTP Code Box -->
              <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">كود التحقق:</p>
                <div style="font-size: 36px; font-weight: bold; color: #6366f1; letter-spacing: 8px; font-family: monospace;">
                  ${otpCode}
                </div>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                هذا الكود صالح لمدة 60 دقيقة فقط.
              </p>
              
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 0 0 20px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
                  ⚠️ إذا لم تطلب استعادة كلمة المرور، يرجى تجاهل هذا البريد.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ${new Date().getFullYear()} © ${siteName} - جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-recovery function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
