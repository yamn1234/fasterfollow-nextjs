"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  Star,
  Clock,
  ShoppingCart,
  ArrowLeft,
  Zap,
  CheckCircle,
  Users,
  MessageSquare,
  Loader2,
  Send,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import JsonLd from '@/components/JsonLd';

interface ServiceDetail {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  min_quantity: number | null;
  max_quantity: number | null;
  average_rating: number | null;
  reviews_count: number | null;
  delivery_time: string | null;
  icon: string | null;
  image_url: string | null;
  requires_comments: boolean | null;
  category_id: string | null;
  slug: string;
  // SEO fields
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  category: {
    name: string;
    name_ar: string | null;
  } | null;
}

interface RelatedService {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  price: number;
  image_url: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    full_name: string | null;
  } | null;
}

interface ServiceDetailProps {
  initialService?: ServiceDetail | null;
}

const ServiceDetail = ({ initialService }: ServiceDetailProps) => {
  const { slug } = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [service, setService] = useState<ServiceDetail | null>(initialService || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedServices, setRelatedServices] = useState<RelatedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLink, setOrderLink] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(100);
  const [orderComments, setOrderComments] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  useEffect(() => {
    if (slug) {
      if (!service || service.slug !== slug) {
        fetchServiceDetails();
      } else {
        // Even if we have initial service, we might want to fetch reviews
        fetchServiceDetails(true);
      }
    }
  }, [slug]);

  const fetchServiceDetails = async (onlyReviews = false) => {
    try {
      if (!onlyReviews) setLoading(true);

      // Fetch service with SEO fields
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select(`
          id, name, name_ar, description, description_ar, price,
          min_quantity, max_quantity, average_rating, reviews_count, delivery_time,
          icon, image_url, requires_comments, category_id, slug,
          seo_title, seo_description, seo_keywords, og_title, og_description, og_image,
          service_categories(name, name_ar)
        `)
        .eq('slug', slug as string)
        .eq('is_active', true)
        .maybeSingle();

      if (!onlyReviews) {
        if (serviceError) throw serviceError;

        if (!serviceData) {
          router.push('/services');
          return;
        }

        const serviceWithSeo: ServiceDetail = {
          ...serviceData,
          requires_comments: serviceData.requires_comments,
          category: serviceData.service_categories as any,
          category_id: serviceData.category_id,
          slug: serviceData.slug,
        };
        setService(serviceWithSeo);
        setOrderQuantity(serviceData.min_quantity || 100);

        // Fetch related services
        if (serviceData.category_id) {
          const { data: relatedData } = await supabase
            .from('services')
            .select('id, name, name_ar, slug, price, image_url')
            .eq('category_id', serviceData.category_id)
            .eq('is_active', true)
            .neq('id', serviceData.id)
            .limit(4);

          if (relatedData) setRelatedServices(relatedData);
        }
      }

      const activeServiceId = onlyReviews ? service?.id : serviceData?.id;
      const activeCategoryId = onlyReviews ? service?.category_id : serviceData?.category_id;
      if (!activeServiceId) return;

      // Fetch related services (runs in both modes)
      if (activeCategoryId && relatedServices.length === 0) {
        const { data: relatedData } = await supabase
          .from('services')
          .select('id, name, name_ar, slug, price, image_url')
          .eq('category_id', activeCategoryId)
          .eq('is_active', true)
          .neq('id', activeServiceId)
          .limit(4);

        if (relatedData) setRelatedServices(relatedData);
      }

      // Fetch approved reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          profiles!reviews_user_id_fkey(full_name)
        `)
        .eq('service_id', activeServiceId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsData) {
        setReviews(
          reviewsData.map((r: any) => ({
            ...r,
            user: r.profiles,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!service || !user || !profile) return;

    if (!orderLink.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال الرابط',
        variant: 'destructive',
      });
      return;
    }

    if (service.requires_comments) {
      const commentsLines = orderComments.split('\n').filter(line => line.trim()).length;
      if (commentsLines !== orderQuantity) {
        toast({
          title: 'خطأ',
          description: `عدد التعليقات (${commentsLines}) يجب أن يساوي الكمية المطلوبة (${orderQuantity})`,
          variant: 'destructive',
        });
        return;
      }
    }

    const totalPrice = (service.price / 1000) * orderQuantity;

    if (profile.balance < totalPrice) {
      toast({
        title: 'رصيد غير كافٍ',
        description: 'يرجى شحن رصيدك أولاً',
        variant: 'destructive',
      });
      return;
    }

    setIsOrdering(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          service_id: service.id,
          link: orderLink.trim(),
          quantity: orderQuantity,
          price: totalPrice,
          status: 'pending',
          comments: service.requires_comments ? orderComments.trim() : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const newBalance = profile.balance - totalPrice;
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'purchase',
        amount: -totalPrice,
        balance_before: profile.balance,
        balance_after: newBalance,
        order_id: order.id,
        description: `طلب خدمة: ${service.name_ar || service.name}`,
      });

      try {
        await supabase.functions.invoke('smm-place-order', {
          body: { orderId: order.id },
        });
      } catch (e) {
        console.log('Provider order will be processed later');
      }

      toast({
        title: 'تم الطلب بنجاح! 🎉',
        description: 'سيتم معالجة طلبك قريباً',
      });

      setShowOrderDialog(false);
      setOrderLink('');
      setOrderComments('');
    } catch (error: any) {
      console.error('Order error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إنشاء الطلب',
        variant: 'destructive',
      });
    } finally {
      setIsOrdering(false);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          }`}
      />
    ));
  };

  const calculatePrice = () => {
    if (!service) return '0.00';
    return ((service.price / 1000) * orderQuantity).toFixed(2);
  };

  // Rating distribution (mock for now, can be calculated from reviews)
  const ratingDistribution = [
    { stars: 5, percentage: 70 },
    { stars: 4, percentage: 20 },
    { stars: 3, percentage: 7 },
    { stars: 2, percentage: 2 },
    { stars: 1, percentage: 1 },
  ];

  if (loading && !service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={service.seo_title || service.name_ar || service.name}
        description={
          service.seo_description ||
          service.description_ar ||
          service.description ||
          `احصل على ${service.name_ar || service.name} بسرعة وأمان من فاستر فولو. أفضل الأسعار مع ضمان التنفيذ ودعم فني على مدار الساعة.`
        }
        keywords={service.seo_keywords || undefined}
        canonicalUrl={`/services/${slug}`}
        ogImage={service.og_image || service.image_url || undefined}
        ogType="product"
        productPrice={service.price}
        productCurrency="USD"
        productAvailability="InStock"
      />
      <JsonLd
        data={[
          {
            type: 'Product',
            name: service.name_ar || service.name,
            description: service.description_ar || service.description || '',
            image: service.image_url || undefined,
            brand: 'فاستر فولو',
            price: service.price,
            priceCurrency: 'USD',
            availability: 'InStock',
            url: `https://fasterfollow.net/services/${slug}`,
            aggregateRating: service.average_rating && service.reviews_count ? {
              ratingValue: service.average_rating,
              reviewCount: service.reviews_count,
            } : undefined,
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'الرئيسية', url: '/' },
              { name: 'الخدمات', url: '/services' },
              { name: service.name_ar || service.name, url: `/services/${slug}` },
            ],
          },
        ]}
      />
      <Header />

      <main className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/services" className="hover:text-foreground">
            الخدمات
          </Link>
          <span>/</span>
          <span className="text-foreground">{service.name_ar || service.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Service info (header, desc, features) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start gap-6">
                  {/* Service Image */}
                  {service.image_url && (
                    <div className="w-full sm:w-48 h-48 rounded-xl overflow-hidden bg-secondary shrink-0">
                      <img
                        src={service.image_url}
                        alt={service.name_ar || service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      {service.category && (
                        <Badge variant="secondary" className="mb-3">
                          {service.category.name_ar || service.category.name}
                        </Badge>
                      )}
                      <h1 className="text-2xl md:text-3xl font-bold mb-4">
                        {service.name_ar || service.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <div className="flex">{renderStars(Math.round(service.average_rating || 0))}</div>
                          <span className="font-medium mr-1">{service.average_rating || 0}</span>
                          <span className="text-muted-foreground">
                            ({service.reviews_count || 0} تقييم)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{service.delivery_time || 'فوري - 24 ساعة'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-bold text-primary">
                        ${service.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">لكل 1000</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">وصف الخدمة</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description_ar || service.description || 'لا يوجد وصف متاح لهذه الخدمة.'}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  مميزات الخدمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">جودة عالية</p>
                      <p className="text-sm text-muted-foreground">حسابات حقيقية ونشطة</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">تنفيذ سريع</p>
                      <p className="text-sm text-muted-foreground">{service.delivery_time || 'فوري - 24 ساعة'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">ضمان الخدمة</p>
                      <p className="text-sm text-muted-foreground">استرداد في حالة عدم التنفيذ</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">دعم 24/7</p>
                      <p className="text-sm text-muted-foreground">فريق دعم متاح دائماً</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Order Form (shows after features on mobile, beside them on desktop) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  اطلب الآن
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>الرابط</Label>
                  <Input
                    placeholder="https://..."
                    value={orderLink}
                    onChange={(e) => setOrderLink(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                    min={service.min_quantity || 1}
                    max={service.max_quantity || 100000}
                  />
                  <p className="text-xs text-muted-foreground">
                    الحد الأدنى: {service.min_quantity || 1} - الحد الأقصى:{' '}
                    {service.max_quantity || 100000}
                  </p>
                </div>

                {service.requires_comments && (
                  <div className="space-y-2">
                    <Label>
                      التعليقات المطلوبة *
                      <span className="text-muted-foreground font-normal mr-2">
                        (عدد التعليقات: {orderComments.split('\n').filter(line => line.trim()).length})
                      </span>
                    </Label>
                    <Textarea
                      placeholder="أدخل التعليقات (كل تعليق في سطر جديد)"
                      value={orderComments}
                      onChange={(e) => {
                        const newComments = e.target.value;
                        setOrderComments(newComments);
                        // Auto-calculate quantity from number of comment lines
                        const lines = newComments.split('\n').filter(line => line.trim()).length;
                        if (lines > 0) {
                          setOrderQuantity(lines);
                        }
                      }}
                      rows={4}
                      dir="rtl"
                    />
                    <p className="text-xs text-muted-foreground">
                      الكمية ستحدد تلقائياً من عدد الأسطر
                    </p>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>السعر لكل 1000:</span>
                    <span>${service.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي:</span>
                    <span className="text-primary">${calculatePrice()}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      router.push('/auth');
                      return;
                    }
                    setShowOrderDialog(true);
                  }}
                >
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  {user ? 'متابعة الطلب' : 'سجل دخول للطلب'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Reviews + Related Services - full width row below everything */}
          <div className="lg:col-span-3 space-y-6">
            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-bold">تقييمات العملاء</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Rating Summary */}
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b">
                  <div className="text-center">
                    <p className="text-5xl font-bold">{service.average_rating || 0}</p>
                    <div className="flex justify-center my-2">
                      {renderStars(Math.round(service.average_rating || 0))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      من {service.reviews_count || 0} تقييم
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {ratingDistribution.map((item) => (
                      <div key={item.stars} className="flex items-center gap-2">
                        <span className="text-sm w-8">{item.stars} ⭐</span>
                        <Progress value={item.percentage} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground w-12">
                          {item.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b md:border pb-6 md:p-4 md:rounded-lg last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback>{review.user?.full_name?.[0] || 'م'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{review.user?.full_name || 'مستخدم'}</p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                            <div className="flex my-1">{renderStars(review.rating)}</div>
                            {review.comment && (
                              <p className="text-muted-foreground mt-2">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد تقييمات حتى الآن</p>
                    <p className="text-sm">كن أول من يقيم هذه الخدمة!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Services */}
            {relatedServices.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  خدمات قد تعجبك
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedServices.map((rel) => (
                    <Link key={rel.id} href={`/services/${rel.slug}`}>
                      <Card className="hover:border-primary/50 transition-colors h-full">
                        <CardContent className="p-4 flex gap-4 items-center">
                          {rel.image_url && (
                            <img
                              src={rel.image_url}
                              alt={rel.name_ar || rel.name}
                              className="w-16 h-16 rounded-lg object-cover bg-secondary"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate">{rel.name_ar || rel.name}</h3>
                            <p className="text-primary font-bold">${rel.price.toFixed(2)}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main >

      <Footer />

      {/* Order Confirmation Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الطلب</DialogTitle>
            <DialogDescription>
              تأكد من صحة البيانات قبل إرسال الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>الخدمة:</span>
                <span className="font-medium">{service.name_ar || service.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>الكمية:</span>
                <span>{orderQuantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>الرابط:</span>
                <span className="truncate max-w-[200px]" dir="ltr">
                  {orderLink}
                </span>
              </div>
              {service.requires_comments && orderComments && (
                <div className="text-sm">
                  <span className="block mb-1">التعليقات:</span>
                  <span className="text-muted-foreground text-xs line-clamp-2">
                    {orderComments}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>الإجمالي:</span>
                <span className="text-primary">${calculatePrice()}</span>
              </div>
              {profile && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>رصيدك:</span>
                  <span>${profile.balance.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleOrder} disabled={isOrdering}>
              {isOrdering ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الطلب...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  تأكيد الطلب
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default ServiceDetail;
