import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCustomerLanguage } from "@/contexts/CustomerLanguageContext";
import { Shield, Loader2, CheckCircle, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TwoFactorSettings = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const { language } = useCustomerLanguage();
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingAction, setPendingAction] = useState<"enable" | "disable" | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Fetch current 2FA status
  useEffect(() => {
    const fetch2FAStatus = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("two_factor_enabled")
        .eq("user_id", user.id)
        .single();
      
      if (!error && data) {
        setTwoFactorEnabled(data.two_factor_enabled || false);
      }
    };
    
    fetch2FAStatus();
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (!codeExpiresAt) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((codeExpiresAt.getTime() - now.getTime()) / 1000));
      setRemainingTime(diff);
      
      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle2FA = async (enable: boolean) => {
    if (!user || !session) return;
    
    setPendingAction(enable ? "enable" : "disable");
    setIsLoading(true);
    
    try {
      // Send verification code
      const { data, error } = await supabase.functions.invoke("two-factor-send", {
        body: { 
          user_id: user.id, 
          email: user.email 
        }
      });
      
      if (error || !data?.success) {
        toast({
          title: language === 'ar' ? "خطأ" : "Error",
          description: data?.error || (language === 'ar' ? "فشل إرسال رمز التحقق" : "Failed to send verification code"),
          variant: "destructive",
        });
        return;
      }
      
      setShowVerifyDialog(true);
      setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
      setRemainingTime(600);
      setOtpCode("");
      
      toast({
        title: language === 'ar' ? "تم الإرسال" : "Sent",
        description: language === 'ar' ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني" : "Verification code sent to your email",
      });
    } catch (error) {
      console.error("Error sending 2FA code:", error);
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حدث خطأ غير متوقع" : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!user || !session || !pendingAction) return;
    
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال رمز التحقق المكون من 6 أرقام" : "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Verify the code
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("two-factor-verify", {
        body: { 
          user_id: user.id, 
          code: otpCode 
        }
      });
      
      if (verifyError || !verifyData?.success) {
        toast({
          title: language === 'ar' ? "خطأ" : "Error",
          description: verifyData?.error || (language === 'ar' ? "رمز التحقق غير صحيح" : "Invalid verification code"),
          variant: "destructive",
        });
        return;
      }
      
      // Toggle 2FA status
      const { data: toggleData, error: toggleError } = await supabase.functions.invoke("two-factor-toggle", {
        body: { enabled: pendingAction === "enable" },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (toggleError || !toggleData?.success) {
        toast({
          title: language === 'ar' ? "خطأ" : "Error",
          description: toggleData?.error || (language === 'ar' ? "فشل تحديث الإعدادات" : "Failed to update settings"),
          variant: "destructive",
        });
        return;
      }
      
      setTwoFactorEnabled(pendingAction === "enable");
      setShowVerifyDialog(false);
      setPendingAction(null);
      
      toast({
        title: language === 'ar' ? "تم بنجاح" : "Success",
        description: pendingAction === "enable" 
          ? (language === 'ar' ? "تم تفعيل التحقق الثنائي" : "Two-factor authentication enabled")
          : (language === 'ar' ? "تم إلغاء التحقق الثنائي" : "Two-factor authentication disabled"),
      });
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حدث خطأ غير متوقع" : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("two-factor-send", {
        body: { 
          user_id: user.id, 
          email: user.email 
        }
      });
      
      if (error || !data?.success) {
        toast({
          title: language === 'ar' ? "خطأ" : "Error",
          description: data?.error || (language === 'ar' ? "فشل إرسال رمز التحقق" : "Failed to send verification code"),
          variant: "destructive",
        });
        return;
      }
      
      setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
      setRemainingTime(600);
      setOtpCode("");
      
      toast({
        title: language === 'ar' ? "تم الإرسال" : "Sent",
        description: language === 'ar' ? "تم إعادة إرسال رمز التحقق" : "Verification code resent",
      });
    } catch (error) {
      console.error("Error resending 2FA code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {language === 'ar' ? "التحقق الثنائي (2FA)" : "Two-Factor Authentication"}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? "أضف طبقة حماية إضافية لحسابك عند تسجيل الدخول" 
              : "Add an extra layer of security to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${twoFactorEnabled ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                {twoFactorEnabled ? <CheckCircle className="h-5 w-5" /> : <Shield className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <Label className="text-base font-medium">
                  {language === 'ar' ? "التحقق عبر البريد الإلكتروني" : "Email Verification"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled 
                    ? (language === 'ar' ? "مفعّل - سيتم إرسال كود عند تسجيل الدخول" : "Enabled - A code will be sent on login")
                    : (language === 'ar' ? "غير مفعّل" : "Not enabled")}
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
              disabled={isLoading}
            />
          </div>
          
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
            <div className="flex gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {language === 'ar' ? "كيف يعمل التحقق الثنائي؟" : "How does 2FA work?"}
                </p>
                <p className="mt-1 text-blue-700 dark:text-blue-300">
                  {language === 'ar' 
                    ? "عند تفعيل التحقق الثنائي، سيتم إرسال رمز تحقق إلى بريدك الإلكتروني في كل مرة تحاول فيها تسجيل الدخول. هذا يضمن أن تكون أنت فقط من يستطيع الوصول إلى حسابك."
                    : "When enabled, a verification code will be sent to your email each time you try to log in. This ensures only you can access your account."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={(open) => {
        if (!open) {
          setShowVerifyDialog(false);
          setPendingAction(null);
        }
      }}>
        <DialogContent className="sm:max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {language === 'ar' ? "تأكيد التغيير" : "Confirm Change"}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? `تم إرسال رمز التحقق إلى ${user?.email}` 
                : `Verification code sent to ${user?.email}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">{language === 'ar' ? "رمز التحقق" : "Verification Code"}</Label>
              <Input
                id="otp"
                type="text"
                placeholder={language === 'ar' ? "أدخل الرمز المكون من 6 أرقام" : "Enter 6-digit code"}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-widest"
                dir="ltr"
                maxLength={6}
                disabled={isVerifying}
              />
            </div>
            
            {/* Countdown timer */}
            {remainingTime > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? "الرمز صالح لمدة:" : "Code valid for:"}{" "}
                  <span className="font-mono text-primary font-bold">{formatTime(remainingTime)}</span>
                </p>
              </div>
            )}
            {remainingTime === 0 && codeExpiresAt && (
              <div className="text-center">
                <p className="text-sm text-destructive">
                  {language === 'ar' ? "انتهت صلاحية الرمز" : "Code expired"}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleVerifyCode}
              disabled={isVerifying || remainingTime === 0 || otpCode.length !== 6}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  {language === 'ar' ? "جاري التحقق..." : "Verifying..."}
                </>
              ) : (
                language === 'ar' ? "تأكيد" : "Confirm"
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleResendCode}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              {language === 'ar' ? "إعادة إرسال الرمز" : "Resend Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TwoFactorSettings;
