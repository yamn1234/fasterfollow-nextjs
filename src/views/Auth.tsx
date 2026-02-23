"use client";

import { useState, useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("البريد الإلكتروني غير صالح");
const passwordSchema = z.string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .regex(/[a-zA-Z]/, "كلمة المرور يجب أن تحتوي على حروف")
  .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على أرقام");

const Auth = () => {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isVerifyCode, setIsVerifyCode] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [is2FAVerify, setIs2FAVerify] = useState(false);
  const [pending2FAUserId, setPending2FAUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; confirmPassword?: string; otp?: string }>({});

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  // Check if this is a password recovery redirect (for backwards compatibility)
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsResetPassword(true);
    }
  }, [searchParams]);

  // Countdown timer for OTP expiry
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0].message });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Use our custom OTP system
      const { data, error } = await supabase.functions.invoke('password-reset-request', {
        body: {
          email,
          ip_address: null,
          user_agent: navigator.userAgent
        }
      });

      if (error) {
        toast.error("حدث خطأ. يرجى المحاولة لاحقاً.");
      } else if (data?.success === false) {
        toast.error(data.error || "حدث خطأ");
      } else {
        toast.success(data?.message || "إذا كان الإيميل مسجل لدينا، سيتم إرسال كود التحقق");
        setIsForgotPassword(false);
        setIsVerifyCode(true);
        setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes
        setRemainingTime(600);
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('password-reset-request', {
        body: {
          email,
          ip_address: null,
          user_agent: navigator.userAgent
        }
      });

      if (error || data?.success === false) {
        toast.error(data?.error || "حدث خطأ. يرجى المحاولة لاحقاً.");
      } else {
        toast.success("تم إعادة إرسال كود التحقق");
        setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
        setRemainingTime(600);
        setOtpCode("");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length < 6) {
      setErrors({ otp: "يرجى إدخال كود التحقق المكون من 6 أرقام" });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('password-reset-verify', {
        body: { email, code: otpCode }
      });

      if (error) {
        toast.error("حدث خطأ. يرجى المحاولة لاحقاً.");
      } else if (data?.success === false) {
        toast.error(data.error || "كود التحقق غير صحيح");
      } else {
        toast.success("تم التحقق بنجاح");
        setResetToken(data.reset_token);
        setIsVerifyCode(false);
        setPassword("");
        setConfirmPassword("");
        setIsResetPassword(true);
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = "الاسم الكامل مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // First check if user has 2FA enabled
        const { data: userData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (userData?.user) {
          // Check if 2FA is enabled
          const { data: profileData } = await supabase
            .from("profiles")
            .select("two_factor_enabled, is_suspended, suspension_reason")
            .eq("user_id", userData.user.id)
            .single();

          // Check suspension
          if (profileData?.is_suspended) {
            await supabase.auth.signOut();
            toast.error(profileData.suspension_reason || "تم تعليق حسابك. يرجى التواصل مع الدعم.");
            setIsLoading(false);
            return;
          }

          if (profileData?.two_factor_enabled) {
            // Sign out first, then require 2FA
            await supabase.auth.signOut();

            // Send 2FA code
            const { data: sendData, error: sendError } = await supabase.functions.invoke("two-factor-send", {
              body: { user_id: userData.user.id, email }
            });

            if (sendError || !sendData?.success) {
              toast.error(sendData?.error || "فشل إرسال رمز التحقق");
              setIsLoading(false);
              return;
            }

            setPending2FAUserId(userData.user.id);
            setIs2FAVerify(true);
            setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
            setRemainingTime(600);
            setOtpCode("");
            toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
          } else {
            // No 2FA, proceed normally
            toast.success("تم تسجيل الدخول بنجاح!");
            router.push("/dashboard");
          }
        } else {
          toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("هذا البريد الإلكتروني مسجل بالفعل");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("تم إنشاء الحساب بنجاح!");
          router.push("/dashboard");
        }
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      setErrors({ otp: "يرجى إدخال رمز التحقق المكون من 6 أرقام" });
      return;
    }

    if (!pending2FAUserId) {
      toast.error("جلسة غير صالحة. يرجى تسجيل الدخول مرة أخرى.");
      setIs2FAVerify(false);
      return;
    }

    setIsLoading(true);

    try {
      // Verify 2FA code
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("two-factor-verify", {
        body: { user_id: pending2FAUserId, code: otpCode }
      });

      if (verifyError || !verifyData?.success) {
        toast.error(verifyData?.error || "رمز التحقق غير صحيح");
        setIsLoading(false);
        return;
      }

      // Sign in again
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        toast.error("حدث خطأ أثناء تسجيل الدخول");
        setIs2FAVerify(false);
      } else {
        toast.success("تم تسجيل الدخول بنجاح!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend2FACode = async () => {
    if (!pending2FAUserId) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("two-factor-send", {
        body: { user_id: pending2FAUserId, email }
      });

      if (error || !data?.success) {
        toast.error(data?.error || "فشل إعادة إرسال الرمز");
      } else {
        toast.success("تم إعادة إرسال رمز التحقق");
        setCodeExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
        setRemainingTime(600);
        setOtpCode("");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Use explicit HTTPS production URL to ensure redirect works reliably
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fasterfollow.net';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/dashboard`,
        },
      });
      if (error) {
        toast.error("حدث خطأ أثناء تسجيل الدخول بـ Google");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { password?: string; confirmPassword?: string } = {};

    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.password = err.errors[0].message;
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "كلمتا المرور غير متطابقتين";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Use our custom password reset system if we have a reset token
      if (resetToken && email) {
        const { data, error } = await supabase.functions.invoke('password-reset-complete', {
          body: { email, reset_token: resetToken, new_password: password }
        });

        if (error || data?.success === false) {
          toast.error(data?.error || "حدث خطأ. يرجى المحاولة لاحقاً.");
        } else {
          toast.success("تم تغيير كلمة المرور بنجاح!");
          setIsResetPassword(false);
          setResetToken("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          // Redirect to login
          setIsLogin(true);
        }
      } else {
        // Fallback to Supabase auth for legacy recovery links
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("تم تغيير كلمة المرور بنجاح!");
          setIsResetPassword(false);
          router.push("/dashboard");
        }
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password Form (after clicking email link)
  if (isResetPassword) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <SEOHead
          title="تعيين كلمة مرور جديدة"
          description="أعد تعيين كلمة مرور حسابك في فاستر فولو"
          noIndex
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-lg border-0">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="flex items-center justify-center gap-2 mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
            </Link>
            <div>
              <CardTitle className="text-2xl font-bold">تعيين كلمة مرور جديدة</CardTitle>
              <CardDescription className="mt-2">
                أدخل كلمة المرور الجديدة لحسابك
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10"
                    disabled={isLoading}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 pl-10"
                    disabled={isLoading}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Password requirements */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                <p className="font-medium">متطلبات كلمة المرور:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li className={password.length >= 8 ? "text-green-600" : ""}>8 أحرف على الأقل</li>
                  <li className={/[a-zA-Z]/.test(password) ? "text-green-600" : ""}>تحتوي على حروف</li>
                  <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>تحتوي على أرقام</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ كلمة المرور الجديدة"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // 2FA Verification Form
  if (is2FAVerify) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <SEOHead
          title="التحقق بخطوتين"
          description="تحقق من هويتك للدخول إلى حسابك في فاستر فولو"
          noIndex
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-lg border-0">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="flex items-center justify-center gap-2 mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
            </Link>
            <div>
              <CardTitle className="text-2xl font-bold">التحقق الثنائي</CardTitle>
              <CardDescription className="mt-2">
                تم إرسال رمز التحقق إلى {email}
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handle2FAVerify}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp2fa">رمز التحقق</Label>
                <Input
                  id="otp2fa"
                  type="text"
                  placeholder="أدخل الرمز المكون من 6 أرقام"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  disabled={isLoading}
                  dir="ltr"
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp}</p>
                )}
              </div>

              {/* Countdown timer */}
              {remainingTime > 0 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    الرمز صالح لمدة: <span className="font-mono text-primary font-bold">{formatTime(remainingTime)}</span>
                  </p>
                </div>
              )}
              {remainingTime === 0 && codeExpiresAt && (
                <div className="text-center">
                  <p className="text-sm text-destructive">انتهت صلاحية الرمز</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading || remainingTime === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>

              <button
                type="button"
                onClick={handleResend2FACode}
                disabled={isLoading}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
              >
                إعادة إرسال الرمز
              </button>

              <button
                type="button"
                onClick={() => {
                  setIs2FAVerify(false);
                  setPending2FAUserId(null);
                  setOtpCode("");
                  setErrors({});
                  setCodeExpiresAt(null);
                }}
                className="text-sm text-muted-foreground hover:underline"
              >
                العودة لتسجيل الدخول
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Verify OTP Code Form
  if (isVerifyCode) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <SEOHead
          title="إدخال كود التحقق"
          description="أدخل كود التحقق لإعادة تعيين كلمة مرورك في فاستر فولو"
          noIndex
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-lg border-0">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="flex items-center justify-center gap-2 mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
            </Link>
            <div>
              <CardTitle className="text-2xl font-bold">أدخل كود التحقق</CardTitle>
              <CardDescription className="mt-2">
                تم إرسال كود التحقق إلى {email}
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleVerifyOtp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">كود التحقق</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="أدخل الكود المكون من 6 أرقام"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  disabled={isLoading}
                  dir="ltr"
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp}</p>
                )}
              </div>

              {/* Countdown timer */}
              {remainingTime > 0 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    الكود صالح لمدة: <span className="font-mono text-primary font-bold">{formatTime(remainingTime)}</span>
                  </p>
                </div>
              )}
              {remainingTime === 0 && codeExpiresAt && (
                <div className="text-center">
                  <p className="text-sm text-destructive">انتهت صلاحية الكود</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading || remainingTime === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "تحقق من الكود"
                )}
              </Button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
              >
                إعادة إرسال الكود
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsVerifyCode(false);
                  setOtpCode("");
                  setErrors({});
                  setCodeExpiresAt(null);
                }}
                className="text-sm text-muted-foreground hover:underline"
              >
                العودة لتسجيل الدخول
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Forgot Password Form
  if (isForgotPassword) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <SEOHead
          title="نسيت كلمة المرور"
          description="استرجع كلمة مرور حسابك في فاستر فولو"
          noIndex
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 shadow-lg border-0">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="flex items-center justify-center gap-2 mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
            </Link>
            <div>
              <CardTitle className="text-2xl font-bold">استعادة كلمة المرور</CardTitle>
              <CardDescription className="mt-2">
                أدخل بريدك الإلكتروني لإرسال رابط استعادة كلمة المرور
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال رابط الاستعادة"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrors({});
                }}
                className="text-sm text-primary font-medium hover:underline"
              >
                العودة لتسجيل الدخول
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <SEOHead
        title={isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        description={isLogin ? "سجّل دخولك إلى حسابك في فاستر فولو وأدر طلباتك ومتابعيك" : "أنشئ حسابك في فاستر فولو واستمتع بأفضل خدمات زيادة المتابعين"}
        canonicalUrl="/auth"
        noIndex
      />
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-lg border-0">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="flex items-center justify-center gap-2 mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </CardTitle>
            <CardDescription className="mt-2">
              {isLogin
                ? "أدخل بياناتك للوصول إلى حسابك"
                : "أنشئ حساباً جديداً للبدء في استخدام خدماتنا"}
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="أدخل اسمك الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pr-10"
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrors({});
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  disabled={isLoading}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحميل...
                </>
              ) : isLogin ? (
                "تسجيل الدخول"
              ) : (
                "إنشاء الحساب"
              )}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">أو</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              تسجيل الدخول باستخدام Google
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "إنشاء حساب جديد" : "تسجيل الدخول"}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
