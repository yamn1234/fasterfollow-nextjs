import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCustomerLanguage } from "@/contexts/CustomerLanguageContext";
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Loader2, 
  Save,
  Shield,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const ProfileTab = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { language, t } = useCustomerLanguage();
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى اختيار صورة" : "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "حجم الصورة يجب أن يكون أقل من 2MB" : "Image size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: language === 'ar' ? "تم بنجاح" : "Success",
        description: language === 'ar' ? "تم تحديث الصورة الشخصية" : "Profile picture updated",
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.full_name.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال الاسم" : "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: language === 'ar' ? "تم بنجاح" : "Success",
        description: language === 'ar' ? "تم تحديث الملف الشخصي" : "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <User className="h-7 w-7 text-primary" />
          {language === 'ar' ? "الملف الشخصي" : "Profile"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'ar' ? "إدارة معلومات حسابك" : "Manage your account information"}
        </p>
      </div>

      {/* Profile Picture */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {language === 'ar' ? "الصورة الشخصية" : "Profile Picture"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                disabled={uploadingAvatar}
              />
              <label htmlFor="avatar-upload">
                <Button variant="outline" asChild disabled={uploadingAvatar}>
                  <span className="cursor-pointer">
                    <Camera className="h-4 w-4 ml-2" />
                    {language === 'ar' ? "تغيير الصورة" : "Change Photo"}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? "الحد الأقصى: 2MB | JPG, PNG, GIF" : "Max: 2MB | JPG, PNG, GIF"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {language === 'ar' ? "معلومات الحساب" : "Account Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                {language === 'ar' ? "الاسم الكامل" : "Full Name"}
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pr-10"
                  placeholder={language === 'ar' ? "أدخل اسمك" : "Enter your name"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                {language === 'ar' ? "البريد الإلكتروني" : "Email"}
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="pr-10 bg-secondary/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  {language === 'ar' ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  {language === 'ar' ? "حفظ التغييرات" : "Save Changes"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {language === 'ar' ? "معلومات الحساب" : "Account Info"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{language === 'ar' ? "تاريخ التسجيل" : "Member Since"}</span>
            </div>
            <span className="font-medium">
              {user?.created_at 
                ? format(new Date(user.created_at), 'PPP', { locale: language === 'ar' ? ar : enUS })
                : "-"
              }
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>{language === 'ar' ? "حالة الحساب" : "Account Status"}</span>
            </div>
            <span className="text-green-500 font-medium">
              {language === 'ar' ? "نشط" : "Active"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;
