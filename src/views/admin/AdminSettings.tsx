import { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Palette,
  Shield,
  Database,
  Save,
  Loader2,
  Sun,
  Moon,
  Layout,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  Plus,
  RotateCcw,
  PanelTop,
  PanelBottom,
  Search,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageIconPicker from '@/components/admin/ImageIconPicker';
import {
  HeaderSettings,
  FooterSettings,
  NavItem,
  SocialLink,
  FooterLinkGroup,
  defaultHeaderSettings,
  defaultFooterSettings,
} from '@/hooks/useHeaderFooterSettings';

interface HomepageSection {
  id: string;
  name: string;
  name_ar: string;
  enabled: boolean;
  order: number;
}

const defaultSections: HomepageSection[] = [
  { id: 'hero', name: 'Hero Section', name_ar: 'القسم الرئيسي', enabled: true, order: 1 },
  { id: 'features', name: 'Features', name_ar: 'المميزات', enabled: true, order: 2 },
  { id: 'services', name: 'Services', name_ar: 'الخدمات', enabled: true, order: 3 },
  { id: 'platforms', name: 'Platforms', name_ar: 'المنصات', enabled: true, order: 4 },
  { id: 'cta', name: 'Call to Action', name_ar: 'دعوة للعمل', enabled: true, order: 5 },
];

const colorPresets = [
  { name: 'برتقالي (افتراضي)', primary: '25 95% 53%', secondary: '38 92% 50%' },
  { name: 'أزرق', primary: '221 83% 53%', secondary: '199 89% 48%' },
  { name: 'أخضر', primary: '142 71% 45%', secondary: '160 84% 39%' },
  { name: 'بنفسجي', primary: '262 83% 58%', secondary: '280 87% 65%' },
  { name: 'أحمر', primary: '0 84% 60%', secondary: '15 90% 55%' },
];

import { useRouter } from 'next/navigation';

interface AdminSettingsProps {
  activeTab?: string;
}

const AdminSettings = ({ activeTab: initialTab = 'general' }: AdminSettingsProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update state if prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [settings, setSettings] = useState({
    site_name: 'SMM Panel',
    site_name_ar: 'لوحة SMM',
    site_description: '',
    site_email: '',
    default_currency: 'USD',
    default_language: 'ar',
    timezone: 'Asia/Riyadh',
    maintenance_mode: false,
    allow_registration: true,
    require_email_verification: false,
    min_deposit: 5,
    max_deposit: 1000,
    referral_enabled: true,
    referral_commission: 5,
  });

  const [themeSettings, setThemeSettings] = useState({
    theme_mode: 'dark',
    primary_color: '25 95% 53%',
    secondary_color: '38 92% 50%',
    custom_primary: '',
    custom_secondary: '',
  });

  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(defaultSections);

  const [heroSettings, setHeroSettings] = useState({
    title: 'زيادة متابعينك بسهولة',
    subtitle: 'أفضل منصة لخدمات التواصل الاجتماعي',
    button_text: 'ابدأ الآن',
    button_link: '/auth',
    show_stats: true,
    image_url: '',
    stats: {
      customers: '+10K',
      customers_label: 'عميل سعيد',
      services: '+50',
      services_label: 'خدمة متاحة',
      support: '24/7',
      support_label: 'دعم فني',
    },
  });

  const [servicesSettings, setServicesSettings] = useState({
    title: 'الخدمات',
    title_highlight: 'الأكثر طلباً',
    subtitle: 'اكتشف خدماتنا المميزة والأكثر شعبية بين عملائنا',
  });

  const [platformsSettings, setPlatformsSettings] = useState({
    title: 'اختر',
    title_highlight: 'منصتك المفضلة',
    subtitle: 'نوفر خدمات لجميع منصات التواصل الاجتماعي الشهيرة بأسعار تنافسية وجودة عالية',
  });

  const [featuresSettings, setFeaturesSettings] = useState({
    title: 'لماذا متجر المتابعين؟',
    subtitle: 'نقدم لك تجربة فريدة ومميزة تجعلنا الخيار الأول لآلاف العملاء',
    features: [
      { icon: 'Zap', title: 'سرعة فائقة', description: 'تبدأ الخدمة خلال دقائق من الطلب مع تسليم تدريجي طبيعي' },
      { icon: 'Shield', title: 'ضمان كامل', description: 'نضمن جميع خدماتنا مع تعويض فوري في حالة النقص' },
      { icon: 'DollarSign', title: 'أسعار تنافسية', description: 'أفضل الأسعار في السوق مع جودة عالية لا مثيل لها' },
      { icon: 'Headphones', title: 'دعم فني 24/7', description: 'فريق دعم متخصص جاهز لمساعدتك في أي وقت' },
      { icon: 'Gift', title: 'هدايا مجانية', description: 'احصل على رصيد مجاني عند كل شحن وخدمات مجانية' },
      { icon: 'Clock', title: 'تشغيل آلي', description: 'نظام آلي متطور لبدء الخدمة فوراً بدون تأخير' },
    ],
  });

  const [ctaSettings, setCtaSettings] = useState({
    badge_text: 'احصل على رصيد مجاني للتجربة',
    title: 'ابدأ رحلتك نحو النجاح',
    subtitle: 'على السوشيال ميديا',
    description: 'سجل الآن واحصل على رصيد مجاني لتجربة جميع خدماتنا. لا يوجد حد أدنى للشحن!',
    button_text: 'سجل الآن مجاناً',
    button_link: '/auth',
    stats: {
      customers: '+10,000',
      customers_label: 'عميل نشط',
      orders: '+1M',
      orders_label: 'طلب مكتمل',
      satisfaction: '99%',
      satisfaction_label: 'رضا العملاء',
    },
  });

  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(defaultFooterSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*');

      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(item => {
          try {
            settingsMap[item.key] = JSON.parse(item.value as string);
          } catch {
            settingsMap[item.key] = item.value;
          }
        });

        if (settingsMap.homepage_sections) {
          setHomepageSections(settingsMap.homepage_sections);
        }
        if (settingsMap.theme_settings) {
          setThemeSettings(settingsMap.theme_settings);
        }
        if (settingsMap.hero_settings) {
          setHeroSettings(prev => ({ ...prev, ...settingsMap.hero_settings }));
        }
        if (settingsMap.services_settings) {
          setServicesSettings(prev => ({ ...prev, ...settingsMap.services_settings }));
        }
        if (settingsMap.platforms_settings) {
          setPlatformsSettings(prev => ({ ...prev, ...settingsMap.platforms_settings }));
        }
        if (settingsMap.features_settings) {
          setFeaturesSettings(prev => ({ ...prev, ...settingsMap.features_settings }));
        }
        if (settingsMap.cta_settings) {
          setCtaSettings(prev => ({ ...prev, ...settingsMap.cta_settings }));
        }
        if (settingsMap.header_settings) {
          setHeaderSettings(prev => ({ ...prev, ...settingsMap.header_settings }));
        }
        if (settingsMap.footer_settings) {
          setFooterSettings(prev => ({ ...prev, ...settingsMap.footer_settings }));
        }

        setSettings(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(settingsMap).filter(([key]) => key in prev)
          )
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // حفظ الإعدادات المتعددة بشكل صحيح
      const settingsToSave = [
        { key: 'site_name', value: settings.site_name, group_name: 'general' },
        { key: 'site_name_ar', value: settings.site_name_ar, group_name: 'general' },
        { key: 'site_description', value: settings.site_description, group_name: 'general' },
        { key: 'site_email', value: settings.site_email, group_name: 'general' },
        { key: 'default_currency', value: settings.default_currency, group_name: 'general' },
        { key: 'default_language', value: settings.default_language, group_name: 'localization' },
        { key: 'timezone', value: settings.timezone, group_name: 'localization' },
        { key: 'maintenance_mode', value: settings.maintenance_mode, group_name: 'general' },
        { key: 'allow_registration', value: settings.allow_registration, group_name: 'security' },
        { key: 'require_email_verification', value: settings.require_email_verification, group_name: 'security' },
        { key: 'min_deposit', value: settings.min_deposit, group_name: 'payments' },
        { key: 'max_deposit', value: settings.max_deposit, group_name: 'payments' },
        { key: 'referral_enabled', value: settings.referral_enabled, group_name: 'payments' },
        { key: 'referral_commission', value: settings.referral_commission, group_name: 'payments' },
        { key: 'homepage_sections', value: homepageSections, group_name: 'homepage' },
        { key: 'theme_settings', value: themeSettings, group_name: 'appearance' },
        { key: 'hero_settings', value: heroSettings, group_name: 'homepage' },
        { key: 'services_settings', value: servicesSettings, group_name: 'homepage' },
        { key: 'platforms_settings', value: platformsSettings, group_name: 'homepage' },
        { key: 'features_settings', value: featuresSettings, group_name: 'homepage' },
        { key: 'cta_settings', value: ctaSettings, group_name: 'homepage' },
        { key: 'header_settings', value: headerSettings, group_name: 'layout' },
        { key: 'footer_settings', value: footerSettings, group_name: 'layout' },
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from('site_settings')
          .upsert(
            {
              key: setting.key,
              value: setting.value as any,
              group_name: setting.group_name
            },
            { onConflict: 'key' }
          );
      }

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الإعدادات بنجاح - قم بتحديث الصفحة الرئيسية لرؤية التغييرات',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setHomepageSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, enabled: !section.enabled } : section
      )
    );
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = homepageSections.findIndex(s => s.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === homepageSections.length - 1)
    ) {
      return;
    }

    const newSections = [...homepageSections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];

    setHomepageSections(newSections.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const applyColorPreset = (preset: typeof colorPresets[0]) => {
    setThemeSettings({
      ...themeSettings,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
    });
  };

  const resetToDefaults = () => {
    setHomepageSections(defaultSections);
    setThemeSettings({
      theme_mode: 'dark',
      primary_color: '25 95% 53%',
      secondary_color: '38 92% 50%',
      custom_primary: '',
      custom_secondary: '',
    });
    toast({
      title: 'تم الإعادة',
      description: 'تم إعادة الإعدادات للقيم الافتراضية',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">إعدادات النظام والتكوين</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 ml-2" />
            استعادة الافتراضي
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            حفظ التغييرات
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        // Sync URL with Next.js router
        if (val === 'general') router.push('/admin/settings/general');
        else if (val === 'appearance') router.push('/admin/settings/appearance');
        else if (val === 'seo') router.push('/admin/settings/seo');
        else if (val === 'security') router.push('/admin/settings/security');
        else if (val === 'backup') router.push('/admin/settings/backup');
      }} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="general" className="text-xs md:text-sm">
            <Settings className="w-4 h-4 md:ml-2" />
            <span className="hidden md:inline">عام</span>
          </TabsTrigger>
          <TabsTrigger value="homepage" className="text-xs md:text-sm">
            <Layout className="w-4 h-4 md:ml-2" />
            <span className="hidden md:inline">الصفحة الرئيسية</span>
          </TabsTrigger>
          <TabsTrigger value="header-footer" className="text-xs md:text-sm">
            <PanelTop className="w-4 h-4 md:ml-2" />
            <span className="hidden md:inline">الهيدر والفوتر</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs md:text-sm">
            <Palette className="w-4 h-4 md:ml-2" />
            <span className="hidden md:inline">الألوان</span>
          </TabsTrigger>
          <TabsTrigger value="localization" className="text-xs md:text-sm">
            <Globe className="w-4 h-4 md:ml-2" />
            <span className="hidden md:inline">اللغة</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs md:text-sm">
            <Shield className="w-4 h-4 md:ml-2" />
            <span className="hidden md:inline">الأمان</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs md:text-sm">
            <Database className="w-4 h-4 md:ml-2" />
            <span className="hidden md:inline">المدفوعات</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-xs md:text-sm">
            <Search className="w-4 h-4 md:ml-2" />
            <span className="hidden md:inline">SEO</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الموقع</CardTitle>
              <CardDescription>الإعدادات الأساسية للموقع</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الموقع (English)</Label>
                  <Input
                    value={settings.site_name}
                    onChange={(e) =>
                      setSettings({ ...settings, site_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الموقع (العربية)</Label>
                  <Input
                    value={settings.site_name_ar}
                    onChange={(e) =>
                      setSettings({ ...settings, site_name_ar: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>وصف الموقع</Label>
                <Textarea
                  value={settings.site_description}
                  onChange={(e) =>
                    setSettings({ ...settings, site_description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={settings.site_email}
                  onChange={(e) =>
                    setSettings({ ...settings, site_email: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>وضع الصيانة</CardTitle>
              <CardDescription>
                عند تفعيل وضع الصيانة، لن يتمكن المستخدمون من الوصول للموقع
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">تفعيل وضع الصيانة</p>
                  <p className="text-sm text-muted-foreground">
                    سيظهر للمستخدمين رسالة صيانة
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenance_mode: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage Tab */}
        <TabsContent value="homepage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أقسام الصفحة الرئيسية</CardTitle>
              <CardDescription>
                تحكم في ترتيب وإظهار أقسام الصفحة الرئيسية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {homepageSections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${section.enabled ? 'bg-card' : 'bg-muted/50 opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveSection(section.id, 'up')}
                          disabled={index === 0}
                        >
                          <span className="text-xs">▲</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveSection(section.id, 'down')}
                          disabled={index === homepageSections.length - 1}
                        >
                          <span className="text-xs">▼</span>
                        </Button>
                      </div>
                      <div>
                        <p className="font-medium">{section.name_ar}</p>
                        <p className="text-sm text-muted-foreground">{section.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={section.enabled ? 'default' : 'secondary'}>
                        {section.enabled ? 'مفعّل' : 'معطّل'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSection(section.id)}
                      >
                        {section.enabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات القسم الرئيسي (Hero)</CardTitle>
              <CardDescription>تخصيص النصوص والأزرار في القسم الرئيسي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>صورة القسم الرئيسي</Label>
                <ImageIconPicker
                  value={heroSettings.image_url || ''}
                  onChange={(value) => setHeroSettings({ ...heroSettings, image_url: value })}
                  label="اختر صورة الهيرو"
                  folder="hero"
                  showEmojiPicker={false}
                />
                <p className="text-sm text-muted-foreground">
                  اترك فارغاً لاستخدام الصورة الافتراضية
                </p>
              </div>
              <div className="space-y-2">
                <Label>العنوان الرئيسي</Label>
                <Textarea
                  value={heroSettings.title}
                  onChange={(e) =>
                    setHeroSettings({ ...heroSettings, title: e.target.value })
                  }
                  rows={2}
                  placeholder="زيادة متابعينك بسهولة"
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان الفرعي</Label>
                <Textarea
                  value={heroSettings.subtitle}
                  onChange={(e) =>
                    setHeroSettings({ ...heroSettings, subtitle: e.target.value })
                  }
                  rows={2}
                  placeholder="أفضل منصة لخدمات التواصل الاجتماعي"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نص الزر</Label>
                  <Input
                    value={heroSettings.button_text}
                    onChange={(e) =>
                      setHeroSettings({ ...heroSettings, button_text: e.target.value })
                    }
                    placeholder="ابدأ الآن"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رابط الزر</Label>
                  <Input
                    value={heroSettings.button_link}
                    onChange={(e) =>
                      setHeroSettings({ ...heroSettings, button_link: e.target.value })
                    }
                    dir="ltr"
                    placeholder="/auth"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">إظهار الإحصائيات</p>
                  <p className="text-sm text-muted-foreground">
                    عرض عدد العملاء والطلبات في القسم الرئيسي
                  </p>
                </div>
                <Switch
                  checked={heroSettings.show_stats}
                  onCheckedChange={(checked) =>
                    setHeroSettings({ ...heroSettings, show_stats: checked })
                  }
                />
              </div>

              {heroSettings.show_stats && (
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base font-medium">تخصيص الإحصائيات</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 p-3 border rounded-lg">
                      <Label className="text-sm">العملاء</Label>
                      <Input
                        value={heroSettings.stats?.customers || '+10K'}
                        onChange={(e) =>
                          setHeroSettings({
                            ...heroSettings,
                            stats: { ...heroSettings.stats, customers: e.target.value }
                          })
                        }
                        placeholder="+10K"
                      />
                      <Input
                        value={heroSettings.stats?.customers_label || 'عميل سعيد'}
                        onChange={(e) =>
                          setHeroSettings({
                            ...heroSettings,
                            stats: { ...heroSettings.stats, customers_label: e.target.value }
                          })
                        }
                        placeholder="عميل سعيد"
                      />
                    </div>
                    <div className="space-y-2 p-3 border rounded-lg">
                      <Label className="text-sm">الخدمات</Label>
                      <Input
                        value={heroSettings.stats?.services || '+50'}
                        onChange={(e) =>
                          setHeroSettings({
                            ...heroSettings,
                            stats: { ...heroSettings.stats, services: e.target.value }
                          })
                        }
                        placeholder="+50"
                      />
                      <Input
                        value={heroSettings.stats?.services_label || 'خدمة متاحة'}
                        onChange={(e) =>
                          setHeroSettings({
                            ...heroSettings,
                            stats: { ...heroSettings.stats, services_label: e.target.value }
                          })
                        }
                        placeholder="خدمة متاحة"
                      />
                    </div>
                    <div className="space-y-2 p-3 border rounded-lg">
                      <Label className="text-sm">الدعم</Label>
                      <Input
                        value={heroSettings.stats?.support || '24/7'}
                        onChange={(e) =>
                          setHeroSettings({
                            ...heroSettings,
                            stats: { ...heroSettings.stats, support: e.target.value }
                          })
                        }
                        placeholder="24/7"
                      />
                      <Input
                        value={heroSettings.stats?.support_label || 'دعم فني'}
                        onChange={(e) =>
                          setHeroSettings({
                            ...heroSettings,
                            stats: { ...heroSettings.stats, support_label: e.target.value }
                          })
                        }
                        placeholder="دعم فني"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>نصوص الصفحة الرئيسية</CardTitle>
              <CardDescription>تخصيص اسم الموقع والوصف</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الموقع (English)</Label>
                  <Input
                    value={settings.site_name}
                    onChange={(e) =>
                      setSettings({ ...settings, site_name: e.target.value })
                    }
                    placeholder="SMM Panel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الموقع (العربية)</Label>
                  <Input
                    value={settings.site_name_ar}
                    onChange={(e) =>
                      setSettings({ ...settings, site_name_ar: e.target.value })
                    }
                    placeholder="متجر المتابعين"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>وصف الموقع</Label>
                <Textarea
                  value={settings.site_description}
                  onChange={(e) =>
                    setSettings({ ...settings, site_description: e.target.value })
                  }
                  rows={3}
                  placeholder="نقدم لك أسهل وأبسط وأسرع خدمة لزيادة المتابعين..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Services Section Settings */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات قسم الخدمات</CardTitle>
              <CardDescription>تخصيص عناوين قسم الخدمات الأكثر طلباً</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العنوان (الجزء الأول)</Label>
                  <Input
                    value={servicesSettings.title}
                    onChange={(e) =>
                      setServicesSettings({ ...servicesSettings, title: e.target.value })
                    }
                    placeholder="الخدمات"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان (الجزء الملون)</Label>
                  <Input
                    value={servicesSettings.title_highlight}
                    onChange={(e) =>
                      setServicesSettings({ ...servicesSettings, title_highlight: e.target.value })
                    }
                    placeholder="الأكثر طلباً"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={servicesSettings.subtitle}
                  onChange={(e) =>
                    setServicesSettings({ ...servicesSettings, subtitle: e.target.value })
                  }
                  rows={2}
                  placeholder="اكتشف خدماتنا المميزة والأكثر شعبية بين عملائنا"
                />
              </div>
            </CardContent>
          </Card>

          {/* Platforms Section Settings */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات قسم المنصات</CardTitle>
              <CardDescription>تخصيص عناوين قسم المنصات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العنوان (الجزء الأول)</Label>
                  <Input
                    value={platformsSettings.title}
                    onChange={(e) =>
                      setPlatformsSettings({ ...platformsSettings, title: e.target.value })
                    }
                    placeholder="اختر"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان (الجزء الملون)</Label>
                  <Input
                    value={platformsSettings.title_highlight}
                    onChange={(e) =>
                      setPlatformsSettings({ ...platformsSettings, title_highlight: e.target.value })
                    }
                    placeholder="منصتك المفضلة"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={platformsSettings.subtitle}
                  onChange={(e) =>
                    setPlatformsSettings({ ...platformsSettings, subtitle: e.target.value })
                  }
                  rows={2}
                  placeholder="نوفر خدمات لجميع منصات التواصل الاجتماعي..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Features Settings */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات قسم المميزات</CardTitle>
              <CardDescription>تخصيص عناوين ونصوص قسم المميزات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عنوان القسم</Label>
                  <Input
                    value={featuresSettings.title}
                    onChange={(e) =>
                      setFeaturesSettings({ ...featuresSettings, title: e.target.value })
                    }
                    placeholder="لماذا متجر المتابعين؟"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان الفرعي</Label>
                  <Input
                    value={featuresSettings.subtitle}
                    onChange={(e) =>
                      setFeaturesSettings({ ...featuresSettings, subtitle: e.target.value })
                    }
                    placeholder="نقدم لك تجربة فريدة..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>المميزات (6 مميزات)</Label>
                {featuresSettings.features.map((feature, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg">
                    <Input
                      value={feature.title}
                      onChange={(e) => {
                        const newFeatures = [...featuresSettings.features];
                        newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                        setFeaturesSettings({ ...featuresSettings, features: newFeatures });
                      }}
                      placeholder="عنوان الميزة"
                    />
                    <Input
                      value={feature.description}
                      onChange={(e) => {
                        const newFeatures = [...featuresSettings.features];
                        newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                        setFeaturesSettings({ ...featuresSettings, features: newFeatures });
                      }}
                      placeholder="وصف الميزة"
                      className="md:col-span-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Settings */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات قسم دعوة للعمل (CTA)</CardTitle>
              <CardDescription>تخصيص نصوص وأزرار القسم الختامي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>نص الشارة</Label>
                <Input
                  value={ctaSettings.badge_text}
                  onChange={(e) =>
                    setCtaSettings({ ...ctaSettings, badge_text: e.target.value })
                  }
                  placeholder="احصل على رصيد مجاني للتجربة"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العنوان الرئيسي</Label>
                  <Input
                    value={ctaSettings.title}
                    onChange={(e) =>
                      setCtaSettings({ ...ctaSettings, title: e.target.value })
                    }
                    placeholder="ابدأ رحلتك نحو النجاح"
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان الفرعي</Label>
                  <Input
                    value={ctaSettings.subtitle}
                    onChange={(e) =>
                      setCtaSettings({ ...ctaSettings, subtitle: e.target.value })
                    }
                    placeholder="على السوشيال ميديا"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={ctaSettings.description}
                  onChange={(e) =>
                    setCtaSettings({ ...ctaSettings, description: e.target.value })
                  }
                  rows={2}
                  placeholder="سجل الآن واحصل على رصيد مجاني..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نص الزر</Label>
                  <Input
                    value={ctaSettings.button_text}
                    onChange={(e) =>
                      setCtaSettings({ ...ctaSettings, button_text: e.target.value })
                    }
                    placeholder="سجل الآن مجاناً"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رابط الزر</Label>
                  <Input
                    value={ctaSettings.button_link}
                    onChange={(e) =>
                      setCtaSettings({ ...ctaSettings, button_link: e.target.value })
                    }
                    dir="ltr"
                    placeholder="/auth"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Header & Footer Tab */}
        <TabsContent value="header-footer" className="space-y-4">
          {/* Header Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PanelTop className="w-5 h-5" />
                إعدادات الهيدر
              </CardTitle>
              <CardDescription>تخصيص الشعار وقائمة التنقل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>شعار الموقع</Label>
                  <ImageIconPicker
                    value={headerSettings.logo_url}
                    onChange={(value) => setHeaderSettings({ ...headerSettings, logo_url: value })}
                    label="اختر شعار الموقع"
                    folder="branding"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الموقع (يظهر بجانب الشعار)</Label>
                  <Input
                    value={headerSettings.logo_text}
                    onChange={(e) => setHeaderSettings({ ...headerSettings, logo_text: e.target.value })}
                    placeholder="متجر المتابعين"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">إظهار الرصيد</p>
                  <p className="text-sm text-muted-foreground">عرض رصيد المستخدم في الهيدر</p>
                </div>
                <Switch
                  checked={headerSettings.show_balance}
                  onCheckedChange={(checked) => setHeaderSettings({ ...headerSettings, show_balance: checked })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>روابط القائمة</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHeaderSettings({
                        ...headerSettings,
                        nav_items: [...headerSettings.nav_items, { label: 'رابط جديد', href: '#', isLink: false }]
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة رابط
                  </Button>
                </div>
                {headerSettings.nav_items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                    <Input
                      value={item.label}
                      onChange={(e) => {
                        const newItems = [...headerSettings.nav_items];
                        newItems[index] = { ...newItems[index], label: e.target.value };
                        setHeaderSettings({ ...headerSettings, nav_items: newItems });
                      }}
                      placeholder="اسم الرابط"
                      className="flex-1"
                    />
                    <Input
                      value={item.href}
                      onChange={(e) => {
                        const newItems = [...headerSettings.nav_items];
                        newItems[index] = { ...newItems[index], href: e.target.value };
                        setHeaderSettings({ ...headerSettings, nav_items: newItems });
                      }}
                      placeholder="/services أو #section"
                      dir="ltr"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">صفحة داخلية</Label>
                      <Switch
                        checked={item.isLink}
                        onCheckedChange={(checked) => {
                          const newItems = [...headerSettings.nav_items];
                          newItems[index] = { ...newItems[index], isLink: checked };
                          setHeaderSettings({ ...headerSettings, nav_items: newItems });
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        const newItems = headerSettings.nav_items.filter((_, i) => i !== index);
                        setHeaderSettings({ ...headerSettings, nav_items: newItems });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PanelBottom className="w-5 h-5" />
                إعدادات الفوتر
              </CardTitle>
              <CardDescription>تخصيص روابط الفوتر ووسائل التواصل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>شعار الفوتر</Label>
                  <ImageIconPicker
                    value={footerSettings.logo_url}
                    onChange={(value) => setFooterSettings({ ...footerSettings, logo_url: value })}
                    label="اختر شعار الفوتر"
                    folder="branding"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الموقع في الفوتر</Label>
                  <Input
                    value={footerSettings.logo_text}
                    onChange={(e) => setFooterSettings({ ...footerSettings, logo_text: e.target.value })}
                    placeholder="متجر المتابعين"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>وصف الموقع</Label>
                <Textarea
                  value={footerSettings.description}
                  onChange={(e) => setFooterSettings({ ...footerSettings, description: e.target.value })}
                  rows={2}
                  placeholder="أفضل وأسرع موقع لزيادة المتابعين..."
                />
              </div>

              <div className="space-y-2">
                <Label>نص حقوق النشر</Label>
                <Input
                  value={footerSettings.copyright_text}
                  onChange={(e) => setFooterSettings({ ...footerSettings, copyright_text: e.target.value })}
                  placeholder="متجر المتابعين. جميع الحقوق محفوظة."
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">إظهار شعارات الدفع</p>
                  <p className="text-sm text-muted-foreground">عرض Visa و Mastercard</p>
                </div>
                <Switch
                  checked={footerSettings.show_payment_logos}
                  onCheckedChange={(checked) => setFooterSettings({ ...footerSettings, show_payment_logos: checked })}
                />
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <Label>روابط التواصل الاجتماعي</Label>
                {footerSettings.social_links.map((link, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                    <Select
                      value={link.type}
                      onValueChange={(value: any) => {
                        const newLinks = [...footerSettings.social_links];
                        newLinks[index] = { ...newLinks[index], type: value };
                        setFooterSettings({ ...footerSettings, social_links: newLinks });
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">واتساب</SelectItem>
                        <SelectItem value="telegram">تليجرام</SelectItem>
                        <SelectItem value="email">بريد إلكتروني</SelectItem>
                        <SelectItem value="phone">هاتف</SelectItem>
                        <SelectItem value="twitter">تويتر</SelectItem>
                        <SelectItem value="instagram">انستجرام</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...footerSettings.social_links];
                        newLinks[index] = { ...newLinks[index], url: e.target.value };
                        setFooterSettings({ ...footerSettings, social_links: newLinks });
                      }}
                      placeholder="الرابط"
                      dir="ltr"
                      className="flex-1"
                    />
                    <Switch
                      checked={link.enabled}
                      onCheckedChange={(checked) => {
                        const newLinks = [...footerSettings.social_links];
                        newLinks[index] = { ...newLinks[index], enabled: checked };
                        setFooterSettings({ ...footerSettings, social_links: newLinks });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        const newLinks = footerSettings.social_links.filter((_, i) => i !== index);
                        setFooterSettings({ ...footerSettings, social_links: newLinks });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFooterSettings({
                      ...footerSettings,
                      social_links: [...footerSettings.social_links, { type: 'whatsapp', url: '#', enabled: true }]
                    });
                  }}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة رابط تواصل
                </Button>
              </div>

              {/* Footer Link Groups */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>أقسام الروابط في الفوتر</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFooterSettings({
                        ...footerSettings,
                        link_groups: [...footerSettings.link_groups, { title: 'قسم جديد', links: [] }]
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة قسم
                  </Button>
                </div>
                {footerSettings.link_groups.map((group, groupIndex) => (
                  <div key={groupIndex} className="p-4 border rounded-lg space-y-3">
                    <div className="flex gap-2 items-center">
                      <Input
                        value={group.title}
                        onChange={(e) => {
                          const newGroups = [...footerSettings.link_groups];
                          newGroups[groupIndex] = { ...newGroups[groupIndex], title: e.target.value };
                          setFooterSettings({ ...footerSettings, link_groups: newGroups });
                        }}
                        placeholder="عنوان القسم"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          const newGroups = footerSettings.link_groups.filter((_, i) => i !== groupIndex);
                          setFooterSettings({ ...footerSettings, link_groups: newGroups });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {group.links.map((link, linkIndex) => (
                      <div key={linkIndex} className="flex gap-2 items-center pr-4">
                        <Input
                          value={link.label}
                          onChange={(e) => {
                            const newGroups = [...footerSettings.link_groups];
                            newGroups[groupIndex].links[linkIndex] = { ...link, label: e.target.value };
                            setFooterSettings({ ...footerSettings, link_groups: newGroups });
                          }}
                          placeholder="اسم الرابط"
                          className="flex-1"
                        />
                        <Input
                          value={link.href}
                          onChange={(e) => {
                            const newGroups = [...footerSettings.link_groups];
                            newGroups[groupIndex].links[linkIndex] = { ...link, href: e.target.value };
                            setFooterSettings({ ...footerSettings, link_groups: newGroups });
                          }}
                          placeholder="/page أو #section"
                          dir="ltr"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            const newGroups = [...footerSettings.link_groups];
                            newGroups[groupIndex].links = group.links.filter((_, i) => i !== linkIndex);
                            setFooterSettings({ ...footerSettings, link_groups: newGroups });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newGroups = [...footerSettings.link_groups];
                        newGroups[groupIndex].links = [...group.links, { label: 'رابط جديد', href: '#' }];
                        setFooterSettings({ ...footerSettings, link_groups: newGroups });
                      }}
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة رابط
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>وضع السمة</CardTitle>
              <CardDescription>اختر بين الوضع الفاتح أو الداكن</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${themeSettings.theme_mode === 'light'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                    }`}
                  onClick={() => setThemeSettings({ ...themeSettings, theme_mode: 'light' })}
                >
                  <Sun className="w-8 h-8" />
                  <span className="font-medium">فاتح</span>
                </div>
                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 bg-gray-900 text-white ${themeSettings.theme_mode === 'dark'
                    ? 'border-primary'
                    : 'border-gray-700 hover:border-primary/50'
                    }`}
                  onClick={() => setThemeSettings({ ...themeSettings, theme_mode: 'dark' })}
                >
                  <Moon className="w-8 h-8" />
                  <span className="font-medium">داكن</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ألوان الموقع</CardTitle>
              <CardDescription>اختر نظام ألوان جاهز أو خصص الألوان يدوياً</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">أنظمة ألوان جاهزة</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {colorPresets.map((preset) => (
                    <div
                      key={preset.name}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${themeSettings.primary_color === preset.primary
                        ? 'border-primary'
                        : 'border-border hover:border-primary/50'
                        }`}
                      onClick={() => applyColorPreset(preset)}
                    >
                      <div className="flex gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: `hsl(${preset.primary})` }}
                        />
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: `hsl(${preset.secondary})` }}
                        />
                      </div>
                      <p className="text-sm font-medium">{preset.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <Label className="mb-3 block">ألوان مخصصة (HSL)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اللون الأساسي</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border"
                        style={{ backgroundColor: `hsl(${themeSettings.primary_color})` }}
                      />
                      <Input
                        value={themeSettings.primary_color}
                        onChange={(e) =>
                          setThemeSettings({ ...themeSettings, primary_color: e.target.value })
                        }
                        placeholder="25 95% 53%"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>اللون الثانوي</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border"
                        style={{ backgroundColor: `hsl(${themeSettings.secondary_color})` }}
                      />
                      <Input
                        value={themeSettings.secondary_color}
                        onChange={(e) =>
                          setThemeSettings({ ...themeSettings, secondary_color: e.target.value })
                        }
                        placeholder="38 92% 50%"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  صيغة HSL: درجة اللون (0-360) نسبة التشبع% نسبة السطوع%
                </p>
              </div>

              <div className="border-t pt-6">
                <Label className="mb-3 block">معاينة الألوان</Label>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      style={{
                        background: `linear-gradient(135deg, hsl(${themeSettings.primary_color}), hsl(${themeSettings.secondary_color}))`
                      }}
                    >
                      زر أساسي
                    </Button>
                    <Button variant="outline" className="border-2" style={{ borderColor: `hsl(${themeSettings.primary_color})`, color: `hsl(${themeSettings.primary_color})` }}>
                      زر ثانوي
                    </Button>
                    <Badge style={{ backgroundColor: `hsl(${themeSettings.primary_color})` }}>
                      شارة
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Localization Tab */}
        <TabsContent value="localization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اللغة والمنطقة</CardTitle>
              <CardDescription>إعدادات اللغة والعملة والمنطقة الزمنية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>اللغة الافتراضية</Label>
                  <Select
                    value={settings.default_language}
                    onValueChange={(v) =>
                      setSettings({ ...settings, default_language: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>العملة الافتراضية</Label>
                  <Select
                    value={settings.default_currency}
                    onValueChange={(v) =>
                      setSettings({ ...settings, default_currency: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - دولار أمريكي</SelectItem>
                      <SelectItem value="EUR">EUR - يورو</SelectItem>
                      <SelectItem value="SAR">SAR - ريال سعودي</SelectItem>
                      <SelectItem value="AED">AED - درهم إماراتي</SelectItem>
                      <SelectItem value="EGP">EGP - جنيه مصري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المنطقة الزمنية</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(v) => setSettings({ ...settings, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                      <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                      <SelectItem value="Europe/London">لندن (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">نيويورك (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات التسجيل</CardTitle>
              <CardDescription>التحكم في تسجيل المستخدمين الجدد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">السماح بالتسجيل</p>
                  <p className="text-sm text-muted-foreground">
                    السماح للمستخدمين الجدد بإنشاء حسابات
                  </p>
                </div>
                <Switch
                  checked={settings.allow_registration}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allow_registration: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">التحقق من البريد الإلكتروني</p>
                  <p className="text-sm text-muted-foreground">
                    مطالبة المستخدمين بتأكيد بريدهم الإلكتروني
                  </p>
                </div>
                <Switch
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, require_email_verification: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإيداع</CardTitle>
              <CardDescription>التحكم في حدود الإيداع</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الحد الأدنى للإيداع ($)</Label>
                  <Input
                    type="number"
                    value={settings.min_deposit}
                    onChange={(e) =>
                      setSettings({ ...settings, min_deposit: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى للإيداع ($)</Label>
                  <Input
                    type="number"
                    value={settings.max_deposit}
                    onChange={(e) =>
                      setSettings({ ...settings, max_deposit: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>برنامج الإحالة</CardTitle>
              <CardDescription>إعدادات نظام الإحالة والعمولات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">تفعيل برنامج الإحالة</p>
                  <p className="text-sm text-muted-foreground">
                    السماح للمستخدمين بإحالة آخرين وكسب عمولة
                  </p>
                </div>
                <Switch
                  checked={settings.referral_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, referral_enabled: checked })
                  }
                />
              </div>
              {settings.referral_enabled && (
                <div className="space-y-2">
                  <Label>نسبة عمولة الإحالة (%)</Label>
                  <Input
                    type="number"
                    value={settings.referral_commission}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        referral_commission: Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <SitemapCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sitemap Card Component
const SitemapCard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sitemapStats, setSitemapStats] = useState<{
    services: number;
    blogPosts: number;
    pages: number;
    categories: number;
    lastGenerated: string;
  } | null>(null);
  const [lastSubmission, setLastSubmission] = useState<{
    success: boolean;
    date: string;
    message: string;
  } | null>(null);

  const baseUrl = 'https://fasterfollow.net';
  const sitemapEdgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sitemap?baseUrl=${encodeURIComponent(baseUrl)}`;
  // Use the domain sitemap URL - Cloudflare redirects to Edge Function
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  const fetchSitemapStats = async () => {
    setLoading(true);
    try {
      const { data: services } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_archived', false);

      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact' })
        .eq('status', 'published')
        .eq('is_archived', false);

      const { data: pages } = await supabase
        .from('pages')
        .select('id', { count: 'exact' })
        .eq('is_published', true)
        .eq('is_archived', false);

      const { data: categories } = await supabase
        .from('service_categories')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      setSitemapStats({
        services: services?.length || 0,
        blogPosts: blogPosts?.length || 0,
        pages: pages?.length || 0,
        categories: categories?.length || 0,
        lastGenerated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching sitemap stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitemapStats();
  }, []);

  const handleDownloadSitemap = async () => {
    try {
      const downloadUrl = `${sitemapEdgeFunctionUrl}&download=true`;
      window.open(downloadUrl, '_blank');
      toast({
        title: 'جاري التحميل',
        description: 'سيتم تحميل ملف sitemap.xml',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الـ Sitemap',
        variant: 'destructive',
      });
    }
  };

  const handleViewSitemap = () => {
    window.open(sitemapUrl, '_blank');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(sitemapUrl);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ رابط الـ Sitemap',
    });
  };

  const handleSubmitToGoogle = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-sitemap', {
        body: {
          siteUrl: baseUrl,
          sitemapUrl: sitemapUrl,
        },
      });

      if (error) throw error;

      if (data.success) {
        setLastSubmission({
          success: true,
          date: new Date().toISOString(),
          message: 'تم إرسال الـ Sitemap بنجاح إلى Google',
        });
        toast({
          title: 'تم الإرسال بنجاح',
          description: 'تم إرسال الـ Sitemap إلى Google Search Console',
        });
      } else {
        throw new Error(data.error || 'فشل إرسال الـ Sitemap');
      }
    } catch (error) {
      console.error('Error submitting sitemap:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل إرسال الـ Sitemap';
      setLastSubmission({
        success: false,
        date: new Date().toISOString(),
        message: errorMessage,
      });
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalUrls = sitemapStats
    ? 4 + sitemapStats.services + sitemapStats.blogPosts + sitemapStats.pages + sitemapStats.categories
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          خريطة الموقع (Sitemap)
        </CardTitle>
        <CardDescription>
          يتم تحديث الـ Sitemap تلقائياً عند إضافة أو تعديل المحتوى
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        {sitemapStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalUrls}</p>
              <p className="text-sm text-muted-foreground">إجمالي الروابط</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{sitemapStats.services}</p>
              <p className="text-sm text-muted-foreground">خدمات</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{sitemapStats.blogPosts}</p>
              <p className="text-sm text-muted-foreground">مقالات</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{sitemapStats.pages}</p>
              <p className="text-sm text-muted-foreground">صفحات</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{sitemapStats.categories}</p>
              <p className="text-sm text-muted-foreground">تصنيفات</p>
            </div>
          </div>
        )}

        {/* URL Display */}
        <div className="space-y-2">
          <Label>رابط الـ Sitemap</Label>
          <div className="flex gap-2">
            <Input
              value={sitemapUrl}
              readOnly
              className="font-mono text-xs"
            />
            <Button variant="outline" size="icon" onClick={handleCopyUrl}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            أضف هذا الرابط في Google Search Console لفهرسة موقعك
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleViewSitemap} variant="outline">
            <ExternalLink className="w-4 h-4 ml-2" />
            عرض الـ Sitemap
          </Button>
          <Button onClick={handleDownloadSitemap} variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تحميل sitemap.xml
          </Button>
          <Button onClick={handleSubmitToGoogle} disabled={submitting} className="bg-green-600 hover:bg-green-700">
            {submitting ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 ml-2" />
            )}
            إرسال إلى Google
          </Button>
          <Button variant="ghost" onClick={fetchSitemapStats} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 ml-2" />
            )}
            تحديث الإحصائيات
          </Button>
        </div>

        {/* Last Submission Status */}
        {lastSubmission && (
          <div className={`rounded-lg p-4 ${lastSubmission.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            <div className="flex items-center gap-2">
              {lastSubmission.success ? (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              ) : (
                <div className="w-2 h-2 bg-destructive rounded-full" />
              )}
              <p className={`font-medium text-sm ${lastSubmission.success ? 'text-green-600' : 'text-destructive'}`}>
                {lastSubmission.message}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(lastSubmission.date).toLocaleString('ar-SA')}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm">ملاحظات مهمة:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>تأكد من إضافة موقعك وتثبيته في Google Search Console</li>
            <li>تأكد من إضافة بريد الـ Service Account كمالك للموقع</li>
            <li>يمكنك إرسال الـ Sitemap تلقائياً عند كل تحديث للمحتوى</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
