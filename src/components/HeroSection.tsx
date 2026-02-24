import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap, Shield, Headphones } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import heroImage from "@/assets/hero-rocket.png";
import { useTranslation } from "@/hooks/useTranslation";

// Next.js <Image priority /> handles preloading natively.

interface HeroStats {
  customers: string;
  customers_label: string;
  services: string;
  services_label: string;
  support: string;
  support_label: string;
}

interface HeroSettings {
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  show_stats: boolean;
  image_url?: string;
  stats?: HeroStats;
}

interface SiteSettings {
  site_name: string;
  site_name_ar: string;
  site_description: string;
}

interface HeroSectionProps {
  settings?: HeroSettings;
  siteSettings?: SiteSettings;
}

const HeroSection = ({ settings, siteSettings }: HeroSectionProps) => {
  const { t, isArabic } = useTranslation();

  const title = isArabic
    ? (siteSettings?.site_name_ar || 'متجر المتابعين')
    : (siteSettings?.site_name || 'FasterFollow');
  const description = isArabic
    ? (siteSettings?.site_description || 'نقدم لك أسهل وأبسط وأسرع خدمة لزيادة المتابعين والتفاعل على منصات التواصل الاجتماعي.')
    : 'We provide you with the easiest and fastest service to increase followers and engagement on social media platforms.';
  const buttonText = isArabic
    ? (settings?.button_text || 'تصفح الخدمات')
    : 'Browse Services';
  const buttonLink = settings?.button_link || '/services';
  const showStats = settings?.show_stats ?? true;
  const customImage = settings?.image_url;
  const imageToShow = customImage || heroImage;

  // Preloading is handled by <Image priority /> now.

  const platformText = isArabic
    ? 'تيك توك، إنستجرام، فيسبوك، تويتر، يوتيوب'
    : 'TikTok, Instagram, Facebook, Twitter, YouTube';

  return (
    <section className="relative overflow-hidden gradient-hero py-12 sm:py-16 lg:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className={`text-center ${isArabic ? 'lg:text-right' : 'lg:text-left'} order-2 lg:order-1`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-slide-up">
              {t('welcomeTo')}{" "}
              <span className="text-gradient">{title}</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              {description}{" "}
              <strong className="text-foreground">{platformText}</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="hero" size="xl" className="w-full sm:w-auto" asChild>
                <Link href={buttonLink}>
                  <ShoppingCart className="h-5 w-5" />
                  {buttonText}
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="w-full sm:w-auto" asChild>
                <Link href="/auth">{t('tryFree')}</Link>
              </Button>
            </div>

            {/* Stats */}
            {showStats && (
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-12 pt-8 border-t border-border/50 animate-slide-up`} style={{ animationDelay: "0.3s" }}>
                <div className={`text-center ${isArabic ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className="text-xl md:text-3xl font-bold text-gradient">{settings?.stats?.customers || '+10K'}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {isArabic ? (settings?.stats?.customers_label || 'عميل سعيد') : 'Happy Customers'}
                  </div>
                </div>
                <div className={`text-center ${isArabic ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className="text-xl md:text-3xl font-bold text-gradient">{settings?.stats?.services || '+50'}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {isArabic ? (settings?.stats?.services_label || 'خدمة متاحة') : 'Available Services'}
                  </div>
                </div>
                <div className={`text-center ${isArabic ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className="text-xl md:text-3xl font-bold text-gradient">{settings?.stats?.support || '24/7'}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {isArabic ? (settings?.stats?.support_label || 'دعم فني') : 'Tech Support'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2 flex justify-center">
            <Image
              src={imageToShow}
              alt={`${title} - ${isArabic ? 'زيادة متابعين السوشيال ميديا' : 'Social Media Growth'}`}
              width={512}
              height={512}
              sizes="(max-width: 640px) 320px, (max-width: 1024px) 448px, 512px"
              className="w-full max-w-xs sm:max-w-md lg:max-w-lg object-contain animate-float drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Features Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-bold">{t('ultraFast')}</div>
              <div className="text-sm text-muted-foreground">{t('deliveryInMinutes')}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-bold">{t('fullGuarantee')}</div>
              <div className="text-sm text-muted-foreground">{t('refundOrCompensation')}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-bold">{t('continuousSupport')}</div>
              <div className="text-sm text-muted-foreground">{t('support247')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
