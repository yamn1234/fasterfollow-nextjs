import { useState, useEffect, memo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import ImageIconPicker from '@/components/admin/ImageIconPicker';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Service {
    id: string;
    name: string;
    name_ar: string | null;
    slug: string;
    description: string | null;
    price: number;
    min_quantity: number;
    max_quantity: number;
    is_active: boolean;
    is_archived: boolean;
    category_id: string | null;
    provider_id: string | null;
    seo_title: string | null;
    seo_description: string | null;
    seo_keywords: string | null;
    is_indexable: boolean;
    created_at: string;
    icon: string | null;
    image_url: string | null;
    delivery_time: string | null;
}

interface Category { id: string; name: string; name_ar: string | null; slug: string; is_active: boolean; }
interface Provider { id: string; name: string; }

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: Service | null;
    categories: Category[];
    providers: Provider[];
    onSaved: (savedService: Service, isNew: boolean) => void;
}

const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

const defaultFormData = () => ({
    name: '',
    name_ar: '',
    slug: '',
    description: '',
    description_ar: '',
    price: '',
    min_quantity: '1',
    max_quantity: '10000',
    delivery_time: '',
    category_id: '',
    provider_id: '',
    external_service_id: '',
    is_active: true,
    requires_comments: false,
    icon: '',
    image_url: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    is_indexable: true,
});

const ServiceEditDialog = memo(({ open, onOpenChange, service, categories, providers, onSaved }: Props) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState(defaultFormData());
    const [saving, setSaving] = useState(false);

    // Reset form when dialog opens or service changes
    useEffect(() => {
        if (open) {
            if (service) {
                setFormData({
                    name: service.name,
                    name_ar: service.name_ar || '',
                    slug: service.slug,
                    description: service.description || '',
                    description_ar: '',
                    price: String(service.price),
                    min_quantity: String(service.min_quantity),
                    max_quantity: String(service.max_quantity),
                    delivery_time: service.delivery_time || '',
                    category_id: service.category_id || '',
                    provider_id: service.provider_id || '',
                    external_service_id: (service as any).external_service_id || '',
                    is_active: service.is_active,
                    requires_comments: (service as any).requires_comments || false,
                    icon: service.icon || '',
                    image_url: service.image_url || '',
                    seo_title: service.seo_title || '',
                    seo_description: service.seo_description || '',
                    seo_keywords: service.seo_keywords || '',
                    canonical_url: '',
                    og_title: '',
                    og_description: '',
                    is_indexable: service.is_indexable,
                });
            } else {
                setFormData(defaultFormData());
            }
            setActiveTab('basic');
        }
    }, [open, service]);

    const set = (field: string, value: any) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const serviceData = {
                name: formData.name,
                name_ar: formData.name_ar || null,
                slug: formData.slug || generateSlug(formData.name),
                description: formData.description || null,
                price: parseFloat(formData.price) || 0,
                min_quantity: parseInt(formData.min_quantity) || 1,
                max_quantity: parseInt(formData.max_quantity) || 10000,
                delivery_time: formData.delivery_time || null,
                category_id: formData.category_id || null,
                provider_id: formData.provider_id || null,
                external_service_id: formData.external_service_id || null,
                is_active: formData.is_active,
                requires_comments: formData.requires_comments,
                icon: formData.icon || null,
                image_url: formData.image_url || null,
                seo_title: formData.seo_title || null,
                seo_description: formData.seo_description || null,
                seo_keywords: formData.seo_keywords || null,
                canonical_url: formData.canonical_url || null,
                og_title: formData.og_title || null,
                og_description: formData.og_description || null,
                is_indexable: formData.is_indexable,
            };

            if (service) {
                const { error } = await supabase.from('services').update(serviceData).eq('id', service.id);
                if (error) throw error;
                onSaved({ ...service, ...serviceData } as Service, false);
            } else {
                const { data, error } = await supabase.from('services').insert(serviceData).select().maybeSingle();
                if (error) throw error;
                onSaved(data as Service, true);
            }

            toast({ title: 'تم بنجاح', description: service ? 'تم تحديث الخدمة' : 'تم إضافة الخدمة' });
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: 'خطأ', description: error.message || 'حدث خطأ', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{service ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full">
                        <TabsTrigger value="basic" className="flex-1">معلومات أساسية</TabsTrigger>
                        <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>اسم الخدمة (إنجليزي)</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, slug: generateSlug(e.target.value) }))}
                                    placeholder="Service Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>اسم الخدمة (عربي)</Label>
                                <Input value={formData.name_ar} onChange={(e) => set('name_ar', e.target.value)} placeholder="اسم الخدمة" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>الرابط (Slug)</Label>
                            <Input value={formData.slug} onChange={(e) => set('slug', e.target.value)} placeholder="service-name" dir="ltr" />
                        </div>

                        <div className="space-y-2">
                            <Label>الوصف</Label>
                            <Textarea value={formData.description} onChange={(e) => set('description', e.target.value)} placeholder="وصف الخدمة..." />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>السعر</Label>
                                <Input type="number" step="0.001" value={formData.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label>الحد الأدنى</Label>
                                <Input type="number" value={formData.min_quantity} onChange={(e) => set('min_quantity', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>الحد الأقصى</Label>
                                <Input type="number" value={formData.max_quantity} onChange={(e) => set('max_quantity', e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>السرعة التقريبية</Label>
                            <Input value={formData.delivery_time} onChange={(e) => set('delivery_time', e.target.value)} placeholder="مثال: 0-1 ساعة أو 1-24 ساعة" />
                            <p className="text-xs text-muted-foreground">يتم استيرادها تلقائياً من المزود، ويمكنك تعديلها يدوياً</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>الفئة</Label>
                                <Select value={formData.category_id || 'none'} onValueChange={(v) => set('category_id', v === 'none' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">بدون فئة</SelectItem>
                                        {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>ربط بمزود API</Label>
                                <Select value={formData.provider_id || 'none'} onValueChange={(v) => set('provider_id', v === 'none' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="اختر المزود" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">بدون مزود</SelectItem>
                                        {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.provider_id && (
                            <div className="space-y-2">
                                <Label>معرف الخدمة عند المزود (External Service ID)</Label>
                                <Input value={formData.external_service_id} onChange={(e) => set('external_service_id', e.target.value)} placeholder="مثال: 1234" dir="ltr" />
                                <p className="text-xs text-muted-foreground">رقم الخدمة في API المزود - مطلوب لتنفيذ الطلبات تلقائياً</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <ImageIconPicker label="أيقونة الخدمة" value={formData.icon} onChange={(val) => set('icon', val)} folder="services/icons" />
                            <ImageIconPicker label="صورة الخدمة" value={formData.image_url} onChange={(val) => set('image_url', val)} folder="services/images" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch id="is_active" checked={formData.is_active} onCheckedChange={(v) => set('is_active', v)} />
                            <Label htmlFor="is_active">نشط</Label>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch id="requires_comments" checked={formData.requires_comments} onCheckedChange={(v) => set('requires_comments', v)} />
                            <Label htmlFor="requires_comments">يتطلب تعليقات (مثل خدمات التعليقات)</Label>
                        </div>
                    </TabsContent>

                    <TabsContent value="seo" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>عنوان SEO</Label>
                            <Input value={formData.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="عنوان الصفحة في محركات البحث" />
                            <p className="text-xs text-muted-foreground">{formData.seo_title.length}/60 حرف</p>
                        </div>

                        <div className="space-y-2">
                            <Label>وصف SEO</Label>
                            <Textarea value={formData.seo_description} onChange={(e) => set('seo_description', e.target.value)} placeholder="وصف الصفحة في محركات البحث" />
                            <p className="text-xs text-muted-foreground">{formData.seo_description.length}/160 حرف</p>
                        </div>

                        <div className="space-y-2">
                            <Label>الكلمات المفتاحية</Label>
                            <Input value={formData.seo_keywords} onChange={(e) => set('seo_keywords', e.target.value)} placeholder="كلمة1, كلمة2, كلمة3" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch id="is_indexable" checked={formData.is_indexable} onCheckedChange={(v) => set('is_indexable', v)} />
                            <Label htmlFor="is_indexable">السماح بالفهرسة في محركات البحث</Label>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>إلغاء</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'جاري الحفظ...' : (service ? 'حفظ التغييرات' : 'إضافة الخدمة')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

ServiceEditDialog.displayName = 'ServiceEditDialog';
export default ServiceEditDialog;
