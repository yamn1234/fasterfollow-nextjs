import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerLanguage } from '@/contexts/CustomerLanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Gift, Ticket, CheckCircle2, Loader2 } from 'lucide-react';

const RedeemCouponTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useCustomerLanguage();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [redeemedAmount, setRedeemedAmount] = useState(0);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      toast.error(t('enterCouponCode'));
      return;
    }

    if (!user || !profile) {
      toast.error(t('login'));
      return;
    }

    setLoading(true);

    try {
      // Find the coupon
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('coupon_type', 'balance')
        .eq('is_active', true)
        .maybeSingle();

      if (couponError) throw couponError;

      if (!coupon) {
        toast.error(t('invalidCoupon'));
        return;
      }

      // Check expiration
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error(t('couponExpired'));
        return;
      }

      // Check start date
      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        toast.error(t('invalidCoupon'));
        return;
      }

      // Check max uses
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        toast.error(t('invalidCoupon'));
        return;
      }

      // Check if user already used this coupon
      const { data: existingUsage, error: usageError } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (usageError) throw usageError;

      if (existingUsage) {
        toast.error(t('couponUsed'));
        return;
      }

      const balanceAmount = coupon.balance_amount || 0;
      const newBalance = (profile.balance || 0) + balanceAmount;

      // Update user balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Record coupon usage
      const { error: recordError } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: coupon.id,
          user_id: user.id,
          amount: balanceAmount,
        });

      if (recordError) throw recordError;

      // Increment uses_count on coupon
      const { error: incrementError } = await supabase
        .from('coupons')
        .update({ uses_count: coupon.uses_count + 1 })
        .eq('id', coupon.id);

      if (incrementError) throw incrementError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'bonus',
          amount: balanceAmount,
          balance_before: profile.balance || 0,
          balance_after: newBalance,
          description: `شحن رصيد بكوبون: ${coupon.code}`,
          payment_method: 'coupon',
          payment_reference: coupon.code,
        });

      if (transactionError) throw transactionError;

      // Success
      setRedeemed(true);
      setRedeemedAmount(balanceAmount);
      setCouponCode('');
      refreshProfile();
      toast.success(t('couponSuccess'));

      // Reset success state after 5 seconds
      setTimeout(() => {
        setRedeemed(false);
        setRedeemedAmount(0);
      }, 5000);

    } catch (error) {
      console.error('Error redeeming coupon:', error);
      toast.error(t('invalidCoupon'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('useCoupon')}</h2>
        <p className="text-muted-foreground">{t('enterCouponCode')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Redeem Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              {t('couponCode')}
            </CardTitle>
            <CardDescription>
              {t('enterCouponCode')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {redeemed ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('chargeSuccess')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('addedToBalance')} <span className="text-green-500 font-bold">${redeemedAmount}</span> {t('toYourBalance')}
                </p>
                <Button variant="outline" onClick={() => setRedeemed(false)}>
                  {t('useAnotherCoupon')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRedeem} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={t('enterCouponCode')}
                    className="text-center text-lg font-mono tracking-wider"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !couponCode.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      {t('verifying')}
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 ml-2" />
                      {t('redeemCoupon')}
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {t('couponInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <p>{t('couponInfoText1')}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <p>{t('couponInfoText2')}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <p>{t('couponInfoText3')}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <p>{t('couponInfoText4')}</p>
              </div>
            </div>

            {/* Current Balance */}
            <div className="mt-6 p-4 rounded-xl bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-1">{t('currentBalance')}</p>
              <p className="text-3xl font-bold text-primary">
                ${(profile?.balance || 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RedeemCouponTab;
