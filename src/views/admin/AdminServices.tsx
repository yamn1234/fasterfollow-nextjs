import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Upload,
  Pencil,
  Archive,
  Trash2,
  FolderPlus,
  Settings2,
  ArchiveRestore,
  Loader2,
  CheckSquare,
  Square,
  X,
  ArrowUpDown,
} from 'lucide-react';
import ServiceSortDialog from '@/components/admin/ServiceSortDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageIconPicker from '@/components/admin/ImageIconPicker';

interface Provider {
  id: string;
  name: string;
}

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

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  is_active: boolean;
}

interface ProviderService {
  id: string;
  name: string;
  category: string;
  rate: number;
  min: number;
  max: number;
  description: string | null;
}

const AdminServices = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Sort dialog state
  const [sortDialogOpen, setSortDialogOpen] = useState(false);

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState<'config' | 'select'>('config');
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loadingProviderServices, setLoadingProviderServices] = useState(false);
  const [importSearchQuery, setImportSearchQuery] = useState('');
  const [importCategoryFilter, setImportCategoryFilter] = useState('all');
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  const [singleServiceId, setSingleServiceId] = useState('');
  const [loadingSingleService, setLoadingSingleService] = useState(false);

  const [formData, setFormData] = useState({
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
    // SEO
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    is_indexable: true,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    name_ar: '',
    slug: '',
    is_active: true,
  });

  const [importFormData, setImportFormData] = useState({
    provider_id: '',
    category_id: '',
    price_multiplier: '1.0',
  });

  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchProviders();
  }, [showArchived]);

  const fetchServices = async () => {
    try {
      let query = supabase
        .from('services')
        .select('*')
        .eq('is_archived', showArchived)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('api_providers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchProviderServices = async () => {
    if (!importFormData.provider_id) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار مزود',
        variant: 'destructive',
      });
      return;
    }

    setLoadingProviderServices(true);
    try {
      const response = await supabase.functions.invoke('smm-import-services', {
        body: {
          providerId: importFormData.provider_id,
          action: 'fetch',
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.success) {
        setProviderServices(result.services);
        setImportStep('select');
        setSelectedImportIds(new Set());
        setImportSearchQuery('');
        setImportCategoryFilter('all');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في جلب الخدمات',
        variant: 'destructive',
      });
    } finally {
      setLoadingProviderServices(false);
    }
  };

  const fetchSingleService = async () => {
    if (!importFormData.provider_id) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار مزود',
        variant: 'destructive',
      });
      return;
    }

    if (!singleServiceId.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رقم الخدمة',
        variant: 'destructive',
      });
      return;
    }

    setLoadingSingleService(true);
    try {
      const response = await supabase.functions.invoke('smm-import-services', {
        body: {
          providerId: importFormData.provider_id,
          action: 'fetch_single',
          serviceId: singleServiceId.trim(),
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.success && result.service) {
        setProviderServices([result.service]);
        setImportStep('select');
        setSelectedImportIds(new Set([result.service.id]));
        setImportSearchQuery('');
        setImportCategoryFilter('all');
        toast({
          title: 'تم العثور على الخدمة',
          description: result.service.name,
        });
      } else {
        throw new Error(result.error || 'لم يتم العثور على الخدمة');
      }
    } catch (error: any) {
      console.error('Fetch single service error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'لم يتم العثور على الخدمة',
        variant: 'destructive',
      });
    } finally {
      setLoadingSingleService(false);
    }
  };

  const handleImportServices = async () => {
    if (selectedImportIds.size === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى تحديد خدمة واحدة على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    try {
      const selectedServices = providerServices.filter(s => selectedImportIds.has(s.id));
      
      const response = await supabase.functions.invoke('smm-import-services', {
        body: {
          providerId: importFormData.provider_id,
          categoryId: importFormData.category_id || null,
          priceMultiplier: parseFloat(importFormData.price_multiplier) || 1.0,
          action: 'import',
          selectedServices: selectedServices,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.success) {
        toast({
          title: 'تم بنجاح',
          description: result.message,
        });
        setImportDialogOpen(false);
        setImportStep('config');
        setProviderServices([]);
        fetchServices();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في استيراد الخدمات',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: `تم حذف ${selectedIds.size} خدمة`,
      });

      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
      fetchServices();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في حذف الخدمات',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredServices.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleImportSelectAll = () => {
    if (selectedImportIds.size === filteredProviderServices.length) {
      setSelectedImportIds(new Set());
    } else {
      setSelectedImportIds(new Set(filteredProviderServices.map(s => s.id)));
    }
  };

  const toggleImportSelect = (id: string) => {
    const newSelected = new Set(selectedImportIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImportIds(newSelected);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSaveService = async () => {
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

      if (selectedService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', selectedService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert(serviceData);
        if (error) throw error;
      }

      toast({
        title: 'تم بنجاح',
        description: selectedService ? 'تم تحديث الخدمة' : 'تم إضافة الخدمة',
      });

      setServiceDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveService = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({
          is_archived: !service.is_archived,
          archived_at: service.is_archived ? null : new Date().toISOString(),
        })
        .eq('id', service.id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: service.is_archived ? 'تم استعادة الخدمة' : 'تم أرشفة الخدمة',
      });

      fetchServices();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ',
        variant: 'destructive',
      });
    }
  };

  const handleSaveCategory = async () => {
    try {
      const categoryData = {
        name: categoryFormData.name,
        name_ar: categoryFormData.name_ar || null,
        slug: categoryFormData.slug || generateSlug(categoryFormData.name),
        is_active: categoryFormData.is_active,
      };

      const { error } = await supabase
        .from('service_categories')
        .insert(categoryData);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الفئة',
      });

      setCategoryDialogOpen(false);
      setCategoryFormData({ name: '', name_ar: '', slug: '', is_active: true });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
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
    setSelectedService(null);
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      name_ar: service.name_ar || '',
      slug: service.slug,
      description: service.description || '',
      description_ar: '',
      price: service.price.toString(),
      min_quantity: service.min_quantity.toString(),
      max_quantity: service.max_quantity.toString(),
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
    setServiceDialogOpen(true);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const providerCategories = [...new Set(providerServices.map(s => s.category))].sort();

  const filteredProviderServices = providerServices.filter((service) => {
    const matchesSearch = 
      service.name.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
      service.id.includes(importSearchQuery);
    const matchesCategory = importCategoryFilter === 'all' || service.category === importCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الخدمات</h1>
          <p className="text-muted-foreground">
            {showArchived ? 'الخدمات المؤرشفة' : 'إدارة وتعديل الخدمات'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showArchived ? 'default' : 'outline'}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="w-4 h-4 ml-2" />
            {showArchived ? 'عرض النشطة' : 'عرض المؤرشفة'}
          </Button>
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            <FolderPlus className="w-4 h-4 ml-2" />
            فئة جديدة
          </Button>
          <Button variant="outline" onClick={() => setSortDialogOpen(true)}>
            <ArrowUpDown className="w-4 h-4 ml-2" />
            ترتيب الخدمات
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setImportDialogOpen(true);
              setImportStep('config');
              setProviderServices([]);
              setImportFormData({ provider_id: '', category_id: '', price_multiplier: '1.0' });
            }}
          >
            <Upload className="w-4 h-4 ml-2" />
            استيراد من مزود
          </Button>
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={() => {
              resetForm();
              setServiceDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 ml-2" />
            خدمة جديدة
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <span className="font-medium">تم تحديد {selectedIds.size} خدمة</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء التحديد
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف المحدد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الرابط..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredServices.length && filteredServices.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحد الأدنى / الأقصى</TableHead>
                  <TableHead>السرعة</TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      لا توجد خدمات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.id} className={selectedIds.has(service.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(service.id)}
                          onCheckedChange={() => toggleSelect(service.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">/{service.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories.find(c => c.id === service.category_id)?.name || '-'}
                      </TableCell>
                      <TableCell>${service.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {service.min_quantity.toLocaleString()} / {service.max_quantity.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {service.delivery_time || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={service.is_indexable ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
                            {service.is_indexable ? 'Index' : 'NoIndex'}
                          </Badge>
                          {service.seo_title && (
                            <Badge variant="outline" className="text-xs">SEO</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={service.is_active}
                          onCheckedChange={async (checked) => {
                            await supabase
                              .from('services')
                              .update({ is_active: checked })
                              .eq('id', service.id);
                            fetchServices();
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(service)}>
                              <Pencil className="w-4 h-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings2 className="w-4 h-4 ml-2" />
                              إعدادات SEO
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleArchiveService(service)}>
                              {service.is_archived ? (
                                <>
                                  <ArchiveRestore className="w-4 h-4 ml-2" />
                                  استعادة
                                </>
                              ) : (
                                <>
                                  <Archive className="w-4 h-4 ml-2" />
                                  أرشفة
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
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
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    placeholder="Service Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الخدمة (عربي)</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="اسم الخدمة"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الرابط (Slug)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="service-name"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الخدمة..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>السعر</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأدنى</Label>
                  <Input
                    type="number"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحد الأقصى</Label>
                  <Input
                    type="number"
                    value={formData.max_quantity}
                    onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>السرعة التقريبية</Label>
                <Input
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                  placeholder="مثال: 0-1 ساعة أو 1-24 ساعة"
                />
                <p className="text-xs text-muted-foreground">
                  يتم استيرادها تلقائياً من المزود، ويمكنك تعديلها يدوياً
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Select
                    value={formData.category_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, category_id: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون فئة</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ربط بمزود API</Label>
                  <Select
                    value={formData.provider_id || 'none'}
                    onValueChange={(v) => setFormData({ ...formData, provider_id: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المزود" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مزود</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.provider_id && (
                <div className="space-y-2">
                  <Label>معرف الخدمة عند المزود (External Service ID)</Label>
                  <Input
                    value={formData.external_service_id}
                    onChange={(e) => setFormData({ ...formData, external_service_id: e.target.value })}
                    placeholder="مثال: 1234"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    رقم الخدمة في API المزود - مطلوب لتنفيذ الطلبات تلقائياً
                  </p>
                </div>
              )}

              {/* Image Icon Picker */}
              <div className="grid grid-cols-2 gap-4">
                <ImageIconPicker
                  label="أيقونة الخدمة"
                  value={formData.icon}
                  onChange={(val) => setFormData({ ...formData, icon: val })}
                  folder="services/icons"
                />
                <ImageIconPicker
                  label="صورة الخدمة"
                  value={formData.image_url}
                  onChange={(val) => setFormData({ ...formData, image_url: val })}
                  folder="services/images"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">نشط</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="requires_comments"
                  checked={formData.requires_comments}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_comments: checked })}
                />
                <Label htmlFor="requires_comments">يتطلب تعليقات (مثل خدمات التعليقات)</Label>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>عنوان SEO</Label>
                <Input
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder="عنوان الصفحة في محركات البحث"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seo_title.length}/60 حرف
                </p>
              </div>

              <div className="space-y-2">
                <Label>وصف SEO</Label>
                <Textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  placeholder="وصف الصفحة في محركات البحث"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seo_description.length}/160 حرف
                </p>
              </div>

              <div className="space-y-2">
                <Label>الكلمات المفتاحية</Label>
                <Input
                  value={formData.seo_keywords}
                  onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                  placeholder="كلمة1, كلمة2, كلمة3"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_indexable"
                  checked={formData.is_indexable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_indexable: checked })}
                />
                <Label htmlFor="is_indexable">السماح بالفهرسة في محركات البحث</Label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveService}>
              {selectedService ? 'حفظ التغييرات' : 'إضافة الخدمة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة فئة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الفئة (إنجليزي)</Label>
                <Input
                  value={categoryFormData.name}
                  onChange={(e) => {
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="Category Name"
                />
              </div>
              <div className="space-y-2">
                <Label>اسم الفئة (عربي)</Label>
                <Input
                  value={categoryFormData.name_ar}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name_ar: e.target.value })}
                  placeholder="اسم الفئة"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الرابط (Slug)</Label>
              <Input
                value={categoryFormData.slug}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                placeholder="category-name"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveCategory}>
              إضافة الفئة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Services Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setImportStep('config');
          setProviderServices([]);
          setSingleServiceId('');
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {importStep === 'config' ? 'استيراد خدمات من المزود' : 'اختر الخدمات للاستيراد'}
            </DialogTitle>
          </DialogHeader>
          
          {importStep === 'config' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اختر المزود</Label>
                <Select
                  value={importFormData.provider_id || 'none'}
                  onValueChange={(v) => setImportFormData({ ...importFormData, provider_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مزود API" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">اختر مزود</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الفئة الافتراضية (اختياري)</Label>
                <Select
                  value={importFormData.category_id || 'none'}
                  onValueChange={(v) => setImportFormData({ ...importFormData, category_id: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="بدون فئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون فئة</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مضاعف السعر</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={importFormData.price_multiplier}
                  onChange={(e) => setImportFormData({ ...importFormData, price_multiplier: e.target.value })}
                  placeholder="1.0"
                />
                <p className="text-xs text-muted-foreground">
                  مثال: 1.5 = زيادة 50% على سعر المزود
                </p>
              </div>

              {/* Single Service Search */}
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <Label className="text-sm font-medium">جلب خدمة واحدة برقمها</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={singleServiceId}
                    onChange={(e) => setSingleServiceId(e.target.value)}
                    placeholder="أدخل رقم الخدمة (مثال: 1234)"
                    dir="ltr"
                    className="flex-1"
                  />
                  <Button 
                    onClick={fetchSingleService} 
                    disabled={loadingSingleService || !importFormData.provider_id || !singleServiceId.trim()}
                    variant="secondary"
                  >
                    {loadingSingleService ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  استخدم هذا الخيار لجلب خدمة محددة بدلاً من جميع الخدمات
                </p>
              </div>

              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">أو</span>
                <div className="flex-1 border-t" />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={fetchProviderServices} disabled={loadingProviderServices || !importFormData.provider_id}>
                  {loadingProviderServices ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الجلب...
                    </>
                  ) : (
                    'جلب جميع الخدمات'
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو ID..."
                    value={importSearchQuery}
                    onChange={(e) => setImportSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={importCategoryFilter} onValueChange={setImportCategoryFilter}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="تصفية حسب الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات ({providerServices.length})</SelectItem>
                    {providerCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat} ({providerServices.filter(s => s.category === cat).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selection Info */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedImportIds.size === filteredProviderServices.length && filteredProviderServices.length > 0}
                    onCheckedChange={toggleImportSelectAll}
                  />
                  <span className="text-sm">
                    {selectedImportIds.size > 0 
                      ? `تم تحديد ${selectedImportIds.size} من ${filteredProviderServices.length}`
                      : `${filteredProviderServices.length} خدمة متاحة`
                    }
                  </span>
                </div>
                {selectedImportIds.size > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedImportIds(new Set())}>
                    إلغاء التحديد
                  </Button>
                )}
              </div>

              {/* Services List */}
              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>الخدمة</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>Min/Max</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviderServices.map((service) => (
                      <TableRow 
                        key={service.id}
                        className={`cursor-pointer ${selectedImportIds.has(service.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleImportSelect(service.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedImportIds.has(service.id)}
                            onCheckedChange={() => toggleImportSelect(service.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{service.id}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={service.name}>
                            {service.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {service.category}
                          </Badge>
                        </TableCell>
                        <TableCell>${service.rate.toFixed(4)}</TableCell>
                        <TableCell className="text-xs">
                          {service.min.toLocaleString()} / {service.max.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setImportStep('config')}>
                  رجوع
                </Button>
                <Button 
                  onClick={handleImportServices} 
                  disabled={importing || selectedImportIds.size === 0}
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الاستيراد...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 ml-2" />
                      استيراد {selectedImportIds.size} خدمة
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedIds.size} خدمة؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sort Dialog */}
      <ServiceSortDialog
        open={sortDialogOpen}
        onOpenChange={setSortDialogOpen}
        categories={categories}
        onSortComplete={fetchServices}
      />
    </div>
  );
};

export default AdminServices;
