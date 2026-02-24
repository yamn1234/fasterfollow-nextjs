import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HomepageSection {
  id: string;
  name: string;
  name_ar: string;
  enabled: boolean;
  order: number;
}

export interface HeroStats {
  customers: string;
  customers_label: string;
  services: string;
  services_label: string;
  support: string;
  support_label: string;
}

export interface HeroSettings {
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  show_stats: boolean;
  image_url?: string;
  stats?: HeroStats;
}

export interface SiteSettings {
  site_name: string;
  site_name_ar: string;
  site_description: string;
}

export interface ServicesSettings {
  title: string;
  title_highlight: string;
  subtitle: string;
}

export interface PlatformsSettings {
  title: string;
  title_highlight: string;
  subtitle: string;
}

export interface FeaturesSettings {
  title: string;
  subtitle: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export interface CTAStats {
  customers: string;
  customers_label: string;
  orders: string;
  orders_label: string;
  satisfaction: string;
  satisfaction_label: string;
}

export interface CTASettings {
  badge_text: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  stats?: CTAStats;
}

const defaultSections: HomepageSection[] = [
  { id: 'hero', name: 'Hero Section', name_ar: 'القسم الرئيسي', enabled: true, order: 1 },
  { id: 'features', name: 'Features', name_ar: 'المميزات', enabled: true, order: 2 },
  { id: 'services', name: 'Services', name_ar: 'الخدمات', enabled: true, order: 3 },
  { id: 'platforms', name: 'Platforms', name_ar: 'المنصات', enabled: true, order: 4 },
  { id: 'cta', name: 'Call to Action', name_ar: 'دعوة للعمل', enabled: true, order: 5 },
];

const defaultHeroSettings: HeroSettings = {
  title: 'زيادة متابعينك بسهولة',
  subtitle: 'أفضل منصة لخدمات التواصل الاجتماعي',
  button_text: 'ابدأ الآن',
  button_link: '/auth',
  show_stats: true,
  stats: {
    customers: '+10K',
    customers_label: 'عميل سعيد',
    services: '+50',
    services_label: 'خدمة متاحة',
    support: '24/7',
    support_label: 'دعم فني',
  },
};

const defaultSiteSettings: SiteSettings = {
  site_name: 'SMM Panel',
  site_name_ar: 'متجر المتابعين',
  site_description: 'نقدم لك أسهل وأبسط وأسرع خدمة لزيادة المتابعين والتفاعل على منصات التواصل الاجتماعي.',
};

const defaultServicesSettings: ServicesSettings = {
  title: 'الخدمات',
  title_highlight: 'الأكثر طلباً',
  subtitle: 'اكتشف خدماتنا المميزة والأكثر شعبية بين عملائنا',
};

const defaultPlatformsSettings: PlatformsSettings = {
  title: 'اختر',
  title_highlight: 'منصتك المفضلة',
  subtitle: 'نوفر خدمات لجميع منصات التواصل الاجتماعي الشهيرة بأسعار تنافسية وجودة عالية',
};

const defaultFeaturesSettings: FeaturesSettings = {
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
};

const defaultCTASettings: CTASettings = {
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
};

const CACHE_KEY = 'ff_homepage_settings';
const CACHE_TTL = 3600000; // 1 hour

export const useHomepageSettings = () => {
  const [sections, setSections] = useState<HomepageSection[]>(defaultSections);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(defaultHeroSettings);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [servicesSettings, setServicesSettings] = useState<ServicesSettings>(defaultServicesSettings);
  const [platformsSettings, setPlatformsSettings] = useState<PlatformsSettings>(defaultPlatformsSettings);
  const [featuresSettings, setFeaturesSettings] = useState<FeaturesSettings>(defaultFeaturesSettings);
  const [ctaSettings, setCtaSettings] = useState<CTASettings>(defaultCTASettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load from cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const { timestamp, settings } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_TTL) {
          setSections(settings.sections);
          setHeroSettings(settings.heroSettings);
          setSiteSettings(settings.siteSettings);
          setServicesSettings(settings.servicesSettings);
          setPlatformsSettings(settings.platformsSettings);
          setFeaturesSettings(settings.featuresSettings);
          setCtaSettings(settings.ctaSettings);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Failed to parse homepage settings cache', e);
      }
    }

    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'homepage_sections', 'hero_settings', 'site_name', 'site_name_ar', 'site_description',
          'services_settings', 'platforms_settings', 'features_settings', 'cta_settings'
        ]);

      if (data) {
        let newSections = [...defaultSections];
        let newHero = { ...defaultHeroSettings };
        let newSite = { ...defaultSiteSettings };
        let newServices = { ...defaultServicesSettings };
        let newPlatforms = { ...defaultPlatformsSettings };
        let newFeatures = { ...defaultFeaturesSettings };
        let newCTA = { ...defaultCTASettings };

        data.forEach(item => {
          try {
            let value = item.value;
            if (typeof value === 'string') {
              try {
                value = JSON.parse(value);
              } catch {
                // use as is
              }
            }

            if (item.key === 'homepage_sections' && Array.isArray(value)) {
              newSections = value as unknown as HomepageSection[];
            } else if (item.key === 'hero_settings' && value && typeof value === 'object' && !Array.isArray(value)) {
              newHero = { ...newHero, ...(value as unknown as Partial<HeroSettings>) };
            } else if (item.key === 'services_settings' && value && typeof value === 'object' && !Array.isArray(value)) {
              newServices = { ...newServices, ...(value as unknown as Partial<ServicesSettings>) };
            } else if (item.key === 'platforms_settings' && value && typeof value === 'object' && !Array.isArray(value)) {
              newPlatforms = { ...newPlatforms, ...(value as unknown as Partial<PlatformsSettings>) };
            } else if (item.key === 'features_settings' && value && typeof value === 'object' && !Array.isArray(value)) {
              newFeatures = { ...newFeatures, ...(value as unknown as Partial<FeaturesSettings>) };
            } else if (item.key === 'cta_settings' && value && typeof value === 'object' && !Array.isArray(value)) {
              newCTA = { ...newCTA, ...(value as unknown as Partial<CTASettings>) };
            } else if (item.key === 'site_name' && value) {
              newSite.site_name = String(value);
            } else if (item.key === 'site_name_ar' && value) {
              newSite.site_name_ar = String(value);
            } else if (item.key === 'site_description' && value) {
              newSite.site_description = String(value);
            }
          } catch (e) {
            console.warn('Error parsing setting:', item.key, e);
          }
        });

        setSections(newSections);
        setHeroSettings(newHero);
        setSiteSettings(newSite);
        setServicesSettings(newServices);
        setPlatformsSettings(newPlatforms);
        setFeaturesSettings(newFeatures);
        setCtaSettings(newCTA);

        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          settings: {
            sections: newSections,
            heroSettings: newHero,
            siteSettings: newSite,
            servicesSettings: newServices,
            platformsSettings: newPlatforms,
            featuresSettings: newFeatures,
            ctaSettings: newCTA
          }
        }));
      }
    } catch (error) {
      console.error('Error loading homepage settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedSections = useMemo(() => {
    return [...sections]
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order);
  }, [sections]);

  const isSectionEnabled = (id: string) => {
    const section = sections.find(s => s.id === id);
    return section?.enabled ?? true;
  };

  return {
    sections: sortedSections,
    heroSettings,
    siteSettings,
    servicesSettings,
    platformsSettings,
    featuresSettings,
    ctaSettings,
    loading,
    isSectionEnabled,
    refresh: loadSettings,
  };
};
