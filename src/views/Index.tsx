"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PlatformsSection from "@/components/PlatformsSection";
import ServicesSection from "@/components/ServicesSection";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import { useHomepageSettings } from "@/hooks/useHomepageSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import JsonLd, { getOrganizationSchema, getWebSiteSchema } from "@/components/JsonLd";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);
  const {
    sections,
    heroSettings,
    siteSettings,
    servicesSettings,
    platformsSettings,
    featuresSettings,
    ctaSettings,
    loading
  } = useHomepageSettings();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Skeleton hero section for faster FCP */}
          <section className="relative min-h-[70vh] flex items-center bg-gradient-to-br from-background via-muted/30 to-background">
            <div className="container mx-auto px-4 py-16">
              <div className="animate-pulse space-y-6 max-w-2xl">
                <div className="h-12 bg-muted rounded-lg w-3/4"></div>
                <div className="h-6 bg-muted rounded-lg w-full"></div>
                <div className="h-6 bg-muted rounded-lg w-2/3"></div>
                <div className="flex gap-4 mt-8">
                  <div className="h-12 bg-primary/20 rounded-lg w-32"></div>
                  <div className="h-12 bg-muted rounded-lg w-32"></div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return <HeroSection key="hero" settings={heroSettings} siteSettings={siteSettings} />;
      case 'features':
        return <FeaturesSection key="features" settings={featuresSettings} />;
      case 'services':
        return <ServicesSection key="services" settings={servicesSettings} />;
      case 'platforms':
        return <PlatformsSection key="platforms" settings={platformsSettings} />;
      case 'cta':
        return <CTASection key="cta" settings={ctaSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="أفضل سيرفر بيع متابعين بالخليج"
        description="أفضل موقع لزيادة المتابعين والتفاعل على انستجرام، تيك توك، سناب شات، يوتيوب وتويتر. خدمات سريعة وآمنة بأفضل الأسعار."
        keywords="زيادة متابعين, شراء متابعين, متابعين انستجرام, متابعين تيك توك, متابعين سناب شات"
        canonicalUrl="/"
      />
      <JsonLd data={[getOrganizationSchema(), getWebSiteSchema()]} />
      <Header />
      <main className="flex-1 min-h-[calc(100vh-200px)]">
        {sections.map((section) => renderSection(section.id))}
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
};

export default Index;
