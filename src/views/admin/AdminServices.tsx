import { useState, useEffect, useMemo } from 'react';
import ServiceEditDialog from '@/components/admin/ServiceEditDialog';
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
  Eye,
  ExternalLink,
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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

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

      // Optimistically remove from current list (since showArchived changed)
      setServices(prev => prev.filter(s => s.id !== service.id));
      // Background refresh
      setTimeout(() => fetchServices(), 1000);
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

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setServiceDialogOpen(true);
  };


  const filteredServices = useMemo(() => services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [services, searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredServices.length / PAGE_SIZE);
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredServices.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredServices, currentPage]);

  const providerCategories = useMemo(() => [...new Set(providerServices.map(s => s.category))].sort(), [providerServices]);

  // Reset page to 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const filteredProviderServices = useMemo(() => providerServices.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(importSearchQuery.toLowerCase()) ||
      service.id.includes(importSearchQuery);
    const matchesCategory = importCategoryFilter === 'all' || service.category === importCategoryFilter;
    return matchesSearch && matchesCategory;
  }), [providerServices, importSearchQuery, importCategoryFilter]);

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
              setSelectedService(null);
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
                    <TableCell colSpan={9} className="text-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : paginatedServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      لا توجد خدمات
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedServices.map((service) => (
                    <TableRow key={service.id} className={service.is_archived ? "opacity-60" : ""}>
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
                            // Optimistically update UI immediately
                            setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: checked } : s));
                            await supabase
                              .from('services')
                              .update({ is_active: checked })
                              .eq('id', service.id);
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
                            <DropdownMenuItem
                              onClick={() => window.open(`/services/${service.slug}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 ml-2" />
                              معاينة الرابط
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`https://search.google.com/test/rich-results?url=https://fasterfollow.net/services/${service.slug}`, '_blank')}
                            >
                              <Search className="w-4 h-4 ml-2" />
                              اختبار SEO
                            </DropdownMenuItem>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                عرض {paginatedServices.length} من {filteredServices.length} خدمة
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <span className="text-sm font-medium">
                  صفحة {currentPage} من {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceEditDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={selectedService}
        categories={categories}
        providers={providers}
        onSaved={(savedService, isNew) => {
          if (isNew) {
            setServices(prev => [savedService, ...prev]);
          } else {
            setServices(prev => prev.map(s => s.id === savedService.id ? savedService : s));
          }
          setSelectedService(null);
          // Soft background refresh after 2s
          setTimeout(() => fetchServices(), 2000);
        }}
      />

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
