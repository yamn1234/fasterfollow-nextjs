import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Wallet,
  CreditCard,
  Gift,
  Sparkles,
  CheckCircle,
  Info,
  ExternalLink,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PayPalButton, { preloadPayPalSDK } from "./PayPalButton";
import { useCurrency } from "@/hooks/useCurrency";

interface PaymentGateway {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  fee_percentage: number;
  fee_fixed: number;
  min_amount: number;
  max_amount: number;
  redirect_url: string | null;
  instructions: string | null;
  instructions_ar: string | null;
  gateway_type: string | null;
  image_url: string | null;
}

// Helper function to render text with links
const renderTextWithLinks = (text: string) => {
  // Split by newlines first, then process each line for URLs
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = line.split(urlPattern);

    const elements = parts.map((part, partIndex) => {
      if (urlPattern.test(part)) {
        return (
          <a
            key={partIndex}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            {part}
          </a>
        );
      }
      return <span key={partIndex}>{part}</span>;
    });

    return (
      <span key={lineIndex}>
        {elements}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

interface BonusRate {
  id: string;
  min_amount: number;
  bonus_percentage: number;
  is_active: boolean;
}

const presetAmounts = [5, 10, 25, 50, 100];

const BalanceTab = () => {
  const { user, refreshProfile } = useAuth();
  const { selectedCurrency, format: formatCurrency } = useCurrency();
  const [amount, setAmount] = useState<string>("10");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [bonusRates, setBonusRates] = useState<BonusRate[]>([]);
  const [bonusEnabled, setBonusEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchGateways();
    fetchBonusSettings();
    // Preload PayPal SDK early for faster checkout
    preloadPayPalSDK();
  }, []);

  const fetchGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      setGateways(data || []);
      if (data && data.length > 0) {
        setPaymentMethod(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching gateways:', error);
      toast.error('حدث خطأ في جلب طرق الدفع');
    } finally {
      setLoading(false);
    }
  };

  const fetchBonusSettings = async () => {
    try {
      // Fetch bonus rates
      const { data: rates, error: ratesError } = await supabase
        .from('bonus_settings')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (ratesError) throw ratesError;
      setBonusRates(rates || []);

      // Fetch bonus enabled setting
      const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'bonus_enabled')
        .single();

      if (settings?.value !== undefined) {
        setBonusEnabled(settings.value === true || settings.value === 'true');
      }
    } catch (error) {
      console.error('Error fetching bonus settings:', error);
    }
  };

  const numericAmount = parseFloat(amount) || 0;
  const selectedGateway = gateways.find(g => g.id === paymentMethod);

  // Calculate payment fees
  const feePercentage = selectedGateway?.fee_percentage || 0;
  const feeFixed = selectedGateway?.fee_fixed || 0;
  const paymentFee = (numericAmount * feePercentage / 100) + feeFixed;

  const bonusRate = bonusEnabled
    ? bonusRates.find((r) => numericAmount >= r.min_amount)?.bonus_percentage || 0
    : 0;
  const bonusAmount = (numericAmount * bonusRate) / 100;
  const totalAmount = numericAmount + paymentFee + bonusAmount;


  // PayPal Smart Buttons handlers
  const handlePayPalSuccess = useCallback((capturedAmount: number) => {
    toast.success(`تم شحن رصيدك بنجاح! المبلغ: $${capturedAmount}`);
    refreshProfile();
  }, [refreshProfile]);

  const handlePayPalError = useCallback((error: string) => {
    toast.error(error);
  }, []);

  const handleCryptomusPayment = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    setProcessingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('cryptomus-create-payment', {
        body: {
          amount: numericAmount,
          userId: user.id,
          currency: "USD",
        },
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      } else {
        throw new Error("لم يتم الحصول على رابط الدفع");
      }
    } catch (error) {
      console.error("Cryptomus error:", error);
      toast.error("حدث خطأ في إنشاء طلب الدفع");
      setProcessingPayment(false);
    }
  };

  const handleOnePayment = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    setProcessingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('one-create-payment', {
        body: {
          amount: numericAmount,
          userId: user.id,
          currency: "USD",
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      } else {
        throw new Error("لم يتم الحصول على رابط الدفع");
      }
    } catch (error) {
      console.error("ONE payment error:", error);
      toast.error("حدث خطأ في إنشاء طلب الدفع");
      setProcessingPayment(false);
    }
  };

  const handleFawaterkPayment = async () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    setProcessingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('fawaterk-create-payment', {
        body: {
          amount: numericAmount,
          userId: user.id,
          currency: "USD",
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      } else {
        throw new Error("لم يتم الحصول على رابط الدفع");
      }
    } catch (error) {
      console.error("Fawaterk payment error:", error);
      toast.error("حدث خطأ في إنشاء فاتورة فواتيرك");
      setProcessingPayment(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGateway) {
      toast.error("يرجى اختيار طريقة الدفع");
      return;
    }

    if (numericAmount < selectedGateway.min_amount) {
      toast.error(`الحد الأدنى للشحن هو $${selectedGateway.min_amount}`);
      return;
    }

    if (numericAmount > selectedGateway.max_amount) {
      toast.error(`الحد الأقصى للشحن هو $${selectedGateway.max_amount}`);
      return;
    }

    // PayPal payment is handled by PayPal Smart Buttons, not this submit button
    if (selectedGateway.slug === 'paypal') {
      toast.info("استخدم أزرار PayPal أدناه للدفع");
      return;
    }

    // Cryptomus payment
    if (selectedGateway.slug === 'cryptomus') {
      await handleCryptomusPayment();
      return;
    }

    // Fawaterk payment
    if (selectedGateway.slug === 'fawaterak') {
      await handleFawaterkPayment();
      return;
    }

    // ONE payment (Visa/Mastercard)
    if (selectedGateway.slug === 'one') {
      await handleOnePayment();
      return;
    }

    // إذا كانت طريقة دفع يدوية مع رابط توجيه
    if (selectedGateway.gateway_type === 'manual' && selectedGateway.redirect_url) {
      // فتح الرابط مباشرة في نافذة جديدة
      const redirectUrl = selectedGateway.redirect_url.startsWith('http')
        ? selectedGateway.redirect_url
        : `https://${selectedGateway.redirect_url}`;
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      toast.success('تم فتح صفحة الدفع في نافذة جديدة');
      return;
    }

    toast.success(`تم إرسال طلب شحن بقيمة $${numericAmount.toFixed(2)}`);
  };

  // Handle Cryptomus & Fawaterk returns
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const gateway = urlParams.get('gateway');

    // Handle successful payments
    if (paymentStatus === 'success') {
      toast.success('تم إتمام عملية الدفع بنجاح! سيتم تحديث رصيدك تلقائياً أو خلال لحظات عبر السيرفر.');
      refreshProfile();
      window.history.replaceState({}, '', '/dashboard?tab=balance');
    } else if (paymentStatus === 'cancelled') {
      toast.error('تم إلغاء عملية الدفع.');
      window.history.replaceState({}, '', '/dashboard?tab=balance');
    }
  }, [refreshProfile]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">شحن الرصيد</h1>
        <p className="text-muted-foreground mt-1">
          اشحن رصيدك واحصل على مكافآت إضافية
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Selection */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                اختر المبلغ
              </CardTitle>
              <CardDescription>
                {selectedGateway
                  ? `الحد الأدنى $${selectedGateway.min_amount} - الحد الأقصى $${selectedGateway.max_amount}`
                  : 'اختر طريقة الدفع أولاً'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === String(preset) ? "default" : "outline"}
                    onClick={() => setAmount(String(preset))}
                    className="h-12"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-8 text-lg font-bold h-12"
                  placeholder="أدخل المبلغ"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                طريقة الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : gateways.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد طرق دفع متاحة حالياً
                </div>
              ) : (
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  {gateways.map((gateway) => (
                    <Label
                      key={gateway.id}
                      htmlFor={gateway.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === gateway.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                        }`}
                    >
                      <RadioGroupItem value={gateway.id} id={gateway.id} />
                      {gateway.image_url ? (
                        <img
                          src={gateway.image_url}
                          alt={gateway.name}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <span className="text-2xl">
                          {gateway.gateway_type === 'manual' ? '🔗' : '💳'}
                        </span>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{gateway.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {gateway.gateway_type === 'manual' ? 'دفع يدوي' : 'دفع تلقائي'}
                          {gateway.fee_percentage > 0 && ` • رسوم ${gateway.fee_percentage}%`}
                          {gateway.fee_fixed > 0 && ` + $${gateway.fee_fixed}`}
                        </p>
                        {gateway.instructions_ar && paymentMethod === gateway.id && (
                          <div className="text-sm text-primary mt-2 bg-primary/10 p-2 rounded whitespace-pre-wrap">
                            {renderTextWithLinks(gateway.instructions_ar)}
                          </div>
                        )}
                      </div>
                      {paymentMethod === gateway.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          {/* Bonus Info - Only show if enabled and has rates */}
          {bonusEnabled && bonusRates.length > 0 && (
            <Card className="gradient-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="h-8 w-8" />
                  <div>
                    <p className="font-bold text-lg">مكافآت الشحن</p>
                    <p className="text-sm opacity-80">اشحن أكثر واحصل على المزيد</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {bonusRates
                    .sort((a, b) => a.min_amount - b.min_amount)
                    .map((rate) => (
                      <div
                        key={rate.id}
                        className={`flex justify-between text-sm p-2 rounded ${numericAmount >= rate.min_amount ? "bg-primary-foreground/20" : "opacity-60"
                          }`}
                      >
                        <span>${rate.min_amount}+</span>
                        <span className="font-bold">+{rate.bonus_percentage}% مكافأة</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>ملخص الطلب</span>
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                  <span className="text-base">{selectedCurrency.flag}</span>
                  {selectedCurrency.code}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ</span>
                <div className="text-left">
                  <span className="font-medium">${numericAmount.toFixed(2)}</span>
                  {selectedCurrency.code !== 'USD' && (
                    <span className="text-sm text-muted-foreground mr-2">
                      ({formatCurrency(numericAmount)})
                    </span>
                  )}
                </div>
              </div>
              {selectedGateway && paymentFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>رسوم الدفع</span>
                  <div className="text-left">
                    <span>+${paymentFee.toFixed(2)}</span>
                    {selectedCurrency.code !== 'USD' && (
                      <span className="text-sm mr-2">
                        ({formatCurrency(paymentFee)})
                      </span>
                    )}
                  </div>
                </div>
              )}
              {bonusAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    مكافأة {bonusRate}%
                  </span>
                  <div className="text-left">
                    <span className="font-medium">+${bonusAmount.toFixed(2)}</span>
                    {selectedCurrency.code !== 'USD' && (
                      <span className="text-sm mr-2">
                        ({formatCurrency(bonusAmount)})
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">الإجمالي</span>
                  <div className="text-left">
                    <span className="font-bold text-xl text-gradient">
                      ${totalAmount.toFixed(2)}
                    </span>
                    {selectedCurrency.code !== 'USD' && (
                      <div className="text-sm text-muted-foreground">
                        ≈ {formatCurrency(totalAmount)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PayPal Smart Buttons */}
              {selectedGateway?.slug === 'paypal' && user && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-xs">
                      قد تستغرق صفحة الدفع حتى 30 ثانية للتحميل عند الضغط على الزر
                    </p>
                  </div>
                  <PayPalButton
                    amount={numericAmount + paymentFee}
                    balanceAmount={numericAmount}
                    userId={user.id}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                    disabled={numericAmount < (selectedGateway?.min_amount || 1) || numericAmount > (selectedGateway?.max_amount || 1000)}
                  />
                </div>
              )}

              {/* Regular Submit Button for other gateways */}
              {selectedGateway?.slug !== 'paypal' && (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-4"
                  onClick={handleSubmit}
                  disabled={numericAmount < 1 || !selectedGateway || loading || processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : selectedGateway?.slug === 'cryptomus' ? (
                    <>
                      <Wallet className="h-5 w-5" />
                      الدفع بالعملات الرقمية
                    </>
                  ) : selectedGateway?.slug === 'fawaterak' ? (
                    <>
                      <CreditCard className="h-5 w-5" />
                      الدفع عبر فواتيرك (فيزا/ماستركارد)
                    </>
                  ) : selectedGateway?.slug === 'one' ? (
                    <>
                      <CreditCard className="h-5 w-5" />
                      الدفع بالفيزا/ماستركارد
                    </>
                  ) : selectedGateway?.gateway_type === 'manual' && selectedGateway?.redirect_url ? (
                    <>
                      <ExternalLink className="h-5 w-5" />
                      الذهاب للدفع
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      شحن الآن
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 mt-4">
                <Info className="h-3 w-3" />
                جميع المعاملات آمنة ومشفرة
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BalanceTab;
