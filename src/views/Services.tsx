"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Search, Filter, ShoppingCart, Zap, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useServices, Service } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const Services = () => {
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { categories, services, loading } = useServices();

  const [searchQuery, setSearchQuery] = useState('');
  const categoryParam = searchParams.get('category') || 'all';
  
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orderLink, setOrderLink] = useState('');
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  const [orderComments, setOrderComments] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  // Update selected category when categories load or URL changes
  useEffect(() => {
    if (categoryParam === 'all' || !categoryParam) {
      setSelectedCategory('all');
      return;
    }
    // Wait for categories to load
    if (categories.length === 0) return;
    
    // Check if it's a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryParam);
    if (isUUID) {
      setSelectedCategory(categoryParam);
    } else {
      // Find by slug
      const cat = categories.find(c => c.slug === categoryParam);
      setSelectedCategory(cat?.id || 'all');
    }
  }, [categoryParam, categories]);

  const filteredServices = useMemo(() => {
    let result = services;

    if (selectedCategory !== 'all') {
      result = result.filter(s => s.category_id === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.name_ar?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.description_ar?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [services, selectedCategory, searchQuery]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams);
  };

  const openOrderDialog = (service: Service) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setSelectedService(service);
    setOrderQuantity(service.min_quantity || 100);
    setOrderLink('');
    setOrderComments('');
  };

  const handleOrder = async () => {
    if (!selectedService || !user || !profile) return;

    if (!orderLink.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال الرابط',
        variant: 'destructive',
      });
      return;
    }

    const minQty = selectedService.min_quantity || 1;
    const maxQty = selectedService.max_quantity || 100000;

    if (orderQuantity < minQty || orderQuantity > maxQty) {
      toast({
        title: 'خطأ',
        description: `الكمية يجب أن تكون بين ${minQty} و ${maxQty}`,
        variant: 'destructive',
      });
      return;
    }

    // Check if comments are required
    if (selectedService.requires_comments && !orderComments.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال التعليقات المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    const totalPrice = (selectedService.price / 1000) * orderQuantity;

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
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          service_id: selectedService.id,
          link: orderLink.trim(),
          quantity: orderQuantity,
          price: totalPrice,
          status: 'pending',
          comments: selectedService.requires_comments ? orderComments.trim() : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update balance
      const newBalance = profile.balance - totalPrice;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'purchase',
        amount: -totalPrice,
        balance_before: profile.balance,
        balance_after: newBalance,
        order_id: order.id,
        description: `طلب خدمة: ${selectedService.name_ar || selectedService.name}`,
      });

      // Try to place order with provider
      try {
        await supabase.functions.invoke('smm-place-order', {
          body: { orderId: order.id },
        });
      } catch (e) {
        console.log('Provider order failed, will retry later');
      }

      toast({
        title: 'تم الطلب بنجاح',
        description: 'تم إرسال طلبك وسيتم معالجته قريباً',
      });

      setSelectedService(null);
      setOrderLink('');
      setOrderQuantity(0);
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

  const calculatePrice = () => {
    if (!selectedService) return 0;
    return ((selectedService.price / 1000) * orderQuantity).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="جميع خدمات التواصل الاجتماعي"
        description="اختر من بين مجموعة واسعة من خدمات زيادة المتابعين والتفاعل على انستجرام وتيك توك وسناب شات ويوتيوب وتويتر بأفضل الأسعار"
        keywords="خدمات سوشيال ميديا, زيادة متابعين, لايكات, مشاهدات, تعليقات"
        canonicalUrl="/services"
      />
      <Header />

      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
          <h1 className="text-3xl font-bold mb-2">خدماتنا</h1>
          <p className="text-muted-foreground">
            اختر من بين مجموعة واسعة من خدمات التواصل الاجتماعي
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن خدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full md:w-64">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="جميع الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name_ar || cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              لا توجد خدمات مطابقة لبحثك
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/services/${service.slug}`}>
                        <CardTitle className="text-lg leading-tight hover:text-primary transition-colors cursor-pointer">
                          {service.name_ar || service.name}
                        </CardTitle>
                      </Link>
                      {service.category && (
                        <Badge variant="secondary" className="mt-2">
                          {service.category.name_ar || service.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-primary">
                        ${service.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">لكل 1000</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(service.description_ar || service.description) && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {service.description_ar || service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      الحد الأدنى: {service.min_quantity || 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      الحد الأقصى: {service.max_quantity || 100000}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => openOrderDialog(service)}
                    >
                      <ShoppingCart className="w-4 h-4 ml-2" />
                      اطلب الآن
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                    >
                      <Link href={`/services/${service.slug}`}>التفاصيل</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Order Dialog */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>طلب جديد</DialogTitle>
            <DialogDescription>
              {selectedService?.name_ar || selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                min={selectedService?.min_quantity || 1}
                max={selectedService?.max_quantity || 100000}
              />
              <p className="text-xs text-muted-foreground">
                الحد الأدنى: {selectedService?.min_quantity || 1} - الحد الأقصى:{' '}
                {selectedService?.max_quantity || 100000}
              </p>
            </div>

            {/* Comments Input for services that require it */}
            {selectedService?.requires_comments && (
              <div className="space-y-2">
                <Label>التعليقات (1 لكل سطر)</Label>
                <Textarea
                  placeholder="أدخل التعليقات هنا، كل تعليق في سطر منفصل..."
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
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  عدد التعليقات: {orderComments.split('\n').filter(line => line.trim()).length} | الكمية ستحدد تلقائياً
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>السعر لكل 1000:</span>
                <span>${selectedService?.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>الكمية:</span>
                <span>{orderQuantity}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>الإجمالي:</span>
                <span className="text-primary">${calculatePrice()}</span>
              </div>
              {profile && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>رصيدك الحالي:</span>
                  <span>${profile.balance.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedService(null)}>
              إلغاء
            </Button>
            <Button onClick={handleOrder} disabled={isOrdering}>
              {isOrdering ? 'جاري الطلب...' : 'تأكيد الطلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
