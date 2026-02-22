import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCustomerLanguage } from "@/contexts/CustomerLanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, 
  Lock, 
  Bell, 
  Globe, 
  Palette,
  Loader2,
  Eye,
  EyeOff,
  Languages,
  DollarSign
} from "lucide-react";
import TwoFactorSettings from "./TwoFactorSettings";

const SettingsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, toggleLanguage, t } = useCustomerLanguage();
  const { selectedCurrency, setSelectedCurrency, currencies } = useCurrency();
  const { theme, setTheme } = useTheme();
  
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newsletters: false,
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى ملء جميع الحقول" : "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "كلمات المرور غير متطابقة" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: language === 'ar' ? "تم بنجاح" : "Success",
        description: language === 'ar' ? "تم تغيير كلمة المرور" : "Password changed successfully",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Settings className="h-7 w-7 text-primary" />
          {language === 'ar' ? "الإعدادات" : "Settings"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'ar' ? "تخصيص تجربتك" : "Customize your experience"}
        </p>
      </div>

      {/* Appearance Settings */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {language === 'ar' ? "المظهر" : "Appearance"}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? "تخصيص شكل الموقع" : "Customize how the site looks"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{language === 'ar' ? "الوضع الداكن" : "Dark Mode"}</Label>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? "تفعيل المظهر الداكن" : "Enable dark theme"}
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Currency */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {language === 'ar' ? "اللغة والعملة" : "Language & Currency"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {language === 'ar' ? "اللغة" : "Language"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? "English / العربية" : "العربية / English"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              {language === 'ar' ? "English" : "العربية"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {language === 'ar' ? "العملة" : "Currency"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? "عملة العرض المفضلة" : "Preferred display currency"}
              </p>
            </div>
            <Select 
              value={selectedCurrency.code} 
              onValueChange={(code) => {
                const currency = currencies.find(c => c.code === code);
                if (currency) setSelectedCurrency(currency);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {language === 'ar' ? "الإشعارات" : "Notifications"}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? "إدارة تفضيلات الإشعارات" : "Manage notification preferences"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{language === 'ar' ? "تحديثات الطلبات" : "Order Updates"}</Label>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? "إشعارات حالة الطلبات" : "Order status notifications"}
              </p>
            </div>
            <Switch
              checked={notifications.orderUpdates}
              onCheckedChange={(checked) => setNotifications({ ...notifications, orderUpdates: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{language === 'ar' ? "العروض والخصومات" : "Promotions"}</Label>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? "إشعارات العروض الجديدة" : "New offers and discounts"}
              </p>
            </div>
            <Switch
              checked={notifications.promotions}
              onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{language === 'ar' ? "النشرة البريدية" : "Newsletter"}</Label>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? "تحديثات وأخبار عامة" : "General updates and news"}
              </p>
            </div>
            <Switch
              checked={notifications.newsletters}
              onCheckedChange={(checked) => setNotifications({ ...notifications, newsletters: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <TwoFactorSettings />

      {/* Security Settings */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {language === 'ar' ? "الأمان" : "Security"}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? "إدارة كلمة المرور" : "Manage your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {language === 'ar' ? "كلمة المرور الجديدة" : "New Password"}
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="pr-10"
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {language === 'ar' ? "تأكيد كلمة المرور" : "Confirm Password"}
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="pr-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              variant="outline"
              className="w-full" 
              disabled={changingPassword}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  {language === 'ar' ? "جاري التغيير..." : "Changing..."}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 ml-2" />
                  {language === 'ar' ? "تغيير كلمة المرور" : "Change Password"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
