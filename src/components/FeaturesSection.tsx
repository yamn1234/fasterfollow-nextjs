import { Card, CardContent } from "@/components/ui/card";
import { Zap, Shield, DollarSign, Headphones, Gift, Clock, LucideIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Feature {
  icon: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
}

interface FeaturesSettings {
  title: string;
  subtitle: string;
  features: Feature[];
}

interface FeaturesSectionProps {
  settings?: FeaturesSettings;
}

const iconMap: Record<string, LucideIcon> = {
  Zap,
  Shield,
  DollarSign,
  Headphones,
  Gift,
  Clock,
};

const FeaturesSection = ({ settings }: FeaturesSectionProps) => {
  const { t, isArabic } = useTranslation();
  
  const defaultFeatures: Feature[] = [
    { 
      icon: 'Zap', 
      title: 'سرعة فائقة', 
      title_en: 'Ultra Fast',
      description: 'تبدأ الخدمة خلال دقائق من الطلب مع تسليم تدريجي طبيعي',
      description_en: 'Service starts within minutes with natural gradual delivery'
    },
    { 
      icon: 'Shield', 
      title: 'ضمان كامل', 
      title_en: 'Full Guarantee',
      description: 'نضمن جميع خدماتنا مع تعويض فوري في حالة النقص',
      description_en: 'We guarantee all services with immediate compensation for any shortage'
    },
    { 
      icon: 'DollarSign', 
      title: 'أسعار تنافسية', 
      title_en: 'Competitive Prices',
      description: 'أفضل الأسعار في السوق مع جودة عالية لا مثيل لها',
      description_en: 'Best prices in the market with unmatched quality'
    },
    { 
      icon: 'Headphones', 
      title: 'دعم فني 24/7', 
      title_en: '24/7 Support',
      description: 'فريق دعم متخصص جاهز لمساعدتك في أي وقت',
      description_en: 'Dedicated support team ready to help you anytime'
    },
    { 
      icon: 'Gift', 
      title: 'هدايا مجانية', 
      title_en: 'Free Bonuses',
      description: 'احصل على رصيد مجاني عند كل شحن وخدمات مجانية',
      description_en: 'Get free balance on every deposit and free services'
    },
    { 
      icon: 'Clock', 
      title: 'تشغيل آلي', 
      title_en: 'Auto Processing',
      description: 'نظام آلي متطور لبدء الخدمة فوراً بدون تأخير',
      description_en: 'Advanced automated system for instant service start'
    },
  ];

  const title = isArabic 
    ? (settings?.title || 'لماذا متجر المتابعين؟')
    : 'Why Choose Us?';
  const subtitle = isArabic 
    ? (settings?.subtitle || 'نقدم لك تجربة فريدة ومميزة تجعلنا الخيار الأول لآلاف العملاء')
    : 'We offer a unique experience that makes us the first choice for thousands of customers';
  const features = settings?.features || defaultFeatures;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient">{title}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Zap;
            const featureTitle = isArabic ? feature.title : (feature.title_en || feature.title);
            const featureDescription = isArabic ? feature.description : (feature.description_en || feature.description);
            
            return (
              <Card key={index} variant="feature" className="group">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <IconComponent className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{featureTitle}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {featureDescription}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
