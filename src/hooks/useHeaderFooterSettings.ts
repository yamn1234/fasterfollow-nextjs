import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NavItem {
  label: string;
  href: string;
  isLink?: boolean;
}

export interface SocialLink {
  type: 'whatsapp' | 'email' | 'phone' | 'telegram' | 'twitter' | 'instagram';
  url: string;
  enabled: boolean;
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

export interface HeaderSettings {
  logo_url: string;
  logo_text: string;
  show_balance: boolean;
  nav_items: NavItem[];
}

export interface FooterSettings {
  logo_url: string;
  logo_text: string;
  description: string;
  social_links: SocialLink[];
  link_groups: FooterLinkGroup[];
  copyright_text: string;
  show_payment_logos: boolean;
}

const defaultNavItems: NavItem[] = [
  { label: 'الخدمات', href: '/services', isLink: true },
  { label: 'الأكثر مبيعاً', href: '#top' },
  { label: 'انستجرام', href: '#instagram' },
  { label: 'تيك توك', href: '#tiktok' },
  { label: 'فيسبوك', href: '#facebook' },
  { label: 'يوتيوب', href: '#youtube' },
  { label: 'تويتر', href: '#twitter' },
];

const defaultSocialLinks: SocialLink[] = [
  { type: 'whatsapp', url: '#', enabled: true },
  { type: 'email', url: 'mailto:info@example.com', enabled: true },
  { type: 'phone', url: 'tel:+966500000000', enabled: true },
];

const defaultFooterLinkGroups: FooterLinkGroup[] = [
  {
    title: 'الخدمات',
    links: [
      { label: 'انستجرام', href: '#' },
      { label: 'تيك توك', href: '#' },
      { label: 'فيسبوك', href: '#' },
      { label: 'يوتيوب', href: '#' },
      { label: 'تويتر', href: '#' },
    ],
  },
  {
    title: 'الدعم',
    links: [
      { label: 'الأسئلة الشائعة', href: '#' },
      { label: 'طريقة الطلب', href: '#' },
      { label: 'طرق الدفع', href: '#' },
      { label: 'تواصل معنا', href: '#' },
    ],
  },
  {
    title: 'قانوني',
    links: [
      { label: 'سياسة الخصوصية', href: '#' },
      { label: 'شروط الاستخدام', href: '#' },
      { label: 'سياسة الاسترداد', href: '#' },
    ],
  },
];

const defaultHeaderSettings: HeaderSettings = {
  logo_url: '',
  logo_text: 'فاستر فولو',
  show_balance: true,
  nav_items: defaultNavItems,
};

const defaultFooterSettings: FooterSettings = {
  logo_url: '',
  logo_text: 'فاستر فولو',
  description: 'أفضل وأسرع موقع لزيادة المتابعين والتفاعل على جميع منصات التواصل الاجتماعي في العالم العربي.',
  social_links: defaultSocialLinks,
  link_groups: defaultFooterLinkGroups,
  copyright_text: 'فاستر فولو. جميع الحقوق محفوظة.',
  show_payment_logos: true,
};

export const useHeaderFooterSettings = () => {
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(defaultFooterSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['header_settings', 'footer_settings']);

      if (data) {
        data.forEach(item => {
          try {
            let value = item.value;
            if (typeof value === 'string') {
              try {
                value = JSON.parse(value);
              } catch {
                // استخدم القيمة كما هي
              }
            }

            if (item.key === 'header_settings' && value && typeof value === 'object' && !Array.isArray(value)) {
              setHeaderSettings(prev => ({ ...prev, ...(value as unknown as Partial<HeaderSettings>) }));
            } else if (item.key === 'footer_settings' && value && typeof value === 'object' && !Array.isArray(value)) {
              setFooterSettings(prev => ({ ...prev, ...(value as unknown as Partial<FooterSettings>) }));
            }
          } catch (e) {
            console.warn('Error parsing setting:', item.key, e);
          }
        });
      }
    } catch (error) {
      console.error('Error loading header/footer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    headerSettings,
    footerSettings,
    loading,
    refresh: loadSettings,
  };
};

export { defaultHeaderSettings, defaultFooterSettings, defaultNavItems, defaultSocialLinks, defaultFooterLinkGroups };
