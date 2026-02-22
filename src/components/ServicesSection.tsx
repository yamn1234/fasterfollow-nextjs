import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Zap, Loader2 } from "lucide-react";
import Link from "next/link";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  min_quantity: number | null;
  average_rating: number | null;
  reviews_count: number | null;
  slug: string;
  category?: {
    name: string;
    name_ar: string | null;
    icon: string | null;
    image_url: string | null;
  } | null;
}

interface ServicesSectionProps {
  settings?: {
    title: string;
    title_highlight: string;
    subtitle: string;
  };
}

const ServicesSection = ({ settings }: ServicesSectionProps) => {
  const title = settings?.title || 'الخدمات';
  const titleHighlight = settings?.title_highlight || 'الأكثر طلباً';
  const subtitle = settings?.subtitle || 'اكتشف خدماتنا المميزة والأكثر شعبية بين عملائنا';

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select(`
            id,
            name,
            name_ar,
            description,
            description_ar,
            price,
            min_quantity,
            average_rating,
            reviews_count,
            slug,
            category:service_categories(name, name_ar, icon, image_url)
          `)
          .eq('is_active', true)
          .eq('is_archived', false)
          .order('reviews_count', { ascending: false })
          .limit(6);

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getCategoryVisual = (category: Service['category']): { type: 'emoji' | 'image'; value: string } => {
    if (!category) return { type: 'emoji', value: '📱' };
    
    // If icon is an emoji (short string, not a URL)
    if (category.icon && !category.icon.startsWith('http') && category.icon.length <= 4) {
      return { type: 'emoji', value: category.icon };
    }
    
    // If there's an image URL
    if (category.image_url || (category.icon && category.icon.startsWith('http'))) {
      return { type: 'image', value: category.image_url || category.icon || '' };
    }
    
    // Fallback to platform detection
    const name = category.name?.toLowerCase() || '';
    if (name.includes('instagram') || name.includes('انستجرام') || name.includes('انستقرام')) return { type: 'emoji', value: '📸' };
    if (name.includes('tiktok') || name.includes('تيك توك')) return { type: 'emoji', value: '🎵' };
    if (name.includes('youtube') || name.includes('يوتيوب')) return { type: 'emoji', value: '▶️' };
    if (name.includes('twitter') || name.includes('تويتر')) return { type: 'emoji', value: '🐦' };
    if (name.includes('facebook') || name.includes('فيسبوك')) return { type: 'emoji', value: '👍' };
    if (name.includes('snapchat') || name.includes('سناب')) return { type: 'emoji', value: '👻' };
    if (name.includes('threads') || name.includes('ثريدز')) return { type: 'emoji', value: '🧵' };
    return { type: 'emoji', value: '📱' };
  };

  if (loading) {
    return (
      <section className="py-16 lg:py-24" id="services">
        <div className="container flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-24" id="services">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title} <span className="text-gradient">{titleHighlight}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {services.map((service, index) => {
            const visual = getCategoryVisual(service.category);
            return (
            <Card key={service.id} variant="service" className="relative group">
              {index < 3 && (
                <div className="absolute -top-3 right-4 z-10">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold gradient-primary text-primary-foreground shadow-md">
                    <Zap className="h-3 w-3" />
                    الأكثر مبيعاً
                  </span>
                </div>
              )}

              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4 mb-4">
                  {visual.type === 'image' ? (
                    <img 
                      src={visual.value} 
                      alt={service.name_ar || service.name}
                      width="56"
                      height="56"
                      loading="lazy"
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                      {visual.value}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 truncate">
                      {service.name_ar || service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.description_ar || service.description || 'خدمة مميزة بجودة عالية'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-medium">
                      {service.average_rating?.toFixed(1) || '5.0'}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {(service.reviews_count || 0).toLocaleString()} تقييم
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                    سريع
                  </span>
                  <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                    ضمان
                  </span>
                  {service.category?.name_ar && (
                    <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                      {service.category.name_ar}
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-border">
                  <div>
                    <span className="text-2xl font-bold text-gradient">
                      ${service.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground mr-1">
                      / {service.min_quantity || 1000}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="px-6 pb-6">
                <Button variant="hero" className="w-full group-hover:shadow-lg" asChild>
                  <Link href={`/services/${service.slug}`}>
                    <ShoppingCart className="h-4 w-4" />
                    اطلب الآن
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )})}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <Link href="/services">عرض جميع الخدمات</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;