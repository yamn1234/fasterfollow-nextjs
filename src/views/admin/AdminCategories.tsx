import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  FolderOpen,
  Pencil,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageIconPicker from '@/components/admin/ImageIconPicker';

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  description: string | null;
  description_ar: string | null;
  image_url: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

const AdminCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    slug: '',
    description: '',
    description_ar: '',
    image_url: '',
    icon: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSave = async () => {
    try {
      const categoryData = {
        name: formData.name,
        name_ar: formData.name_ar || null,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        description_ar: formData.description_ar || null,
        image_url: formData.image_url || null,
        icon: formData.icon || null,
        is_active: formData.is_active,
      };

      if (selectedCategory) {
        const { error } = await supabase
          .from('service_categories')
          .update(categoryData)
          .eq('id', selectedCategory.id);

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم تحديث القسم' });
      } else {
        const { error } = await supabase
          .from('service_categories')
          .insert(categoryData);

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم إضافة القسم' });
      }

      setDialogOpen(false);
      resetForm();
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
      image_url: '',
      icon: '',
      is_active: true,
    });
    setSelectedCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      name_ar: category.name_ar || '',
      slug: category.slug,
      description: category.description || '',
      description_ar: category.description_ar || '',
      image_url: category.image_url || '',
      icon: category.icon || '',
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  const toggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('service_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      fetchCategories();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ',
        variant: 'destructive',
      });
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.name_ar?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.filter((c) => !c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الأقسام</h1>
          <p className="text-muted-foreground">إدارة أقسام الخدمات وصورها</p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأقسام</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <FolderOpen className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نشطة</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gray-500/10">
                <FolderOpen className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">غير نشطة</p>
                <p className="text-2xl font-bold">{inactiveCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>القسم</TableHead>
                <TableHead>الرابط</TableHead>
                <TableHead>الصورة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    لا توجد أقسام
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.icon && !category.icon.startsWith('http') && category.icon.length <= 4 ? (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                            {category.icon}
                          </div>
                        ) : category.image_url || (category.icon && category.icon.startsWith('http')) ? (
                          <img
                            src={category.image_url || category.icon || ''}
                            alt={category.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{category.name}</p>
                          {category.name_ar && (
                            <p className="text-sm text-muted-foreground">{category.name_ar}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">/{category.slug}</span>
                    </TableCell>
                    <TableCell>
                      {category.image_url || category.icon ? (
                        <Badge variant="secondary" className="gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {category.icon && !category.icon.startsWith('http') ? 'إيموجي' : 'صورة'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">لا توجد</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={category.is_active}
                        onCheckedChange={() => toggleActive(category)}
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
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>
                            <Pencil className="w-4 h-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="Category Name"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="اسم القسم"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الرابط (Slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="category-name"
                dir="ltr"
              />
            </div>
            <ImageIconPicker
              label="أيقونة/صورة القسم"
              value={formData.icon || formData.image_url}
              onChange={(value) => {
                if (value && !value.startsWith('http') && value.length <= 4) {
                  setFormData({ ...formData, icon: value, image_url: '' });
                } else {
                  setFormData({ ...formData, image_url: value, icon: '' });
                }
              }}
              folder="categories"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>نشط</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {selectedCategory ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
