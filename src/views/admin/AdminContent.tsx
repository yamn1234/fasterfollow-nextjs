import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Loader2,
  Globe,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Page {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  content: string | null;
  is_published: boolean;
  is_archived: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

import { useRouter } from 'next/navigation';

interface AdminContentProps {
  activeTab?: string;
}

const AdminContent = ({ activeTab: initialTab = 'pages' }: AdminContentProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    slug: '',
    content: '',
    content_ar: '',
    is_published: true,
    seo_title: '',
    seo_description: '',
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب الصفحات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingPage) {
        const { error } = await supabase
          .from('pages')
          .update({
            title: formData.title,
            title_ar: formData.title_ar,
            slug: formData.slug,
            content: formData.content,
            content_ar: formData.content_ar,
            is_published: formData.is_published,
            seo_title: formData.seo_title,
            seo_description: formData.seo_description,
          })
          .eq('id', editingPage.id);

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم تحديث الصفحة' });
      } else {
        const { error } = await supabase.from('pages').insert({
          title: formData.title,
          title_ar: formData.title_ar,
          slug: formData.slug,
          content: formData.content,
          content_ar: formData.content_ar,
          is_published: formData.is_published,
          seo_title: formData.seo_title,
          seo_description: formData.seo_description,
        });

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم إضافة الصفحة' });
      }

      setDialogOpen(false);
      resetForm();
      fetchPages();
    } catch (error) {
      console.error('Error saving page:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حفظ الصفحة',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({
          is_archived: !page.is_archived,
          archived_at: page.is_archived ? null : new Date().toISOString(),
        })
        .eq('id', page.id);

      if (error) throw error;
      toast({
        title: 'تم بنجاح',
        description: page.is_archived ? 'تم استعادة الصفحة' : 'تم أرشفة الصفحة',
      });
      fetchPages();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      title_ar: '',
      slug: '',
      content: '',
      content_ar: '',
      is_published: true,
      seo_title: '',
      seo_description: '',
    });
    setEditingPage(null);
  };

  const openEditDialog = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      title_ar: page.title_ar || '',
      slug: page.slug,
      content: page.content || '',
      content_ar: '',
      is_published: page.is_published || false,
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
    });
    setDialogOpen(true);
  };

  const publishedPages = pages.filter((p) => !p.is_archived && p.is_published);
  const draftPages = pages.filter((p) => !p.is_archived && !p.is_published);
  const archivedPages = pages.filter((p) => p.is_archived);

  const getFilteredPages = () => {
    let filtered = pages;
    switch (activeTab) {
      case 'pages':
        filtered = publishedPages;
        break;
      case 'drafts':
        filtered = draftPages;
        break;
      case 'archived':
        filtered = archivedPages;
        break;
    }
    return filtered.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المحتوى</h1>
          <p className="text-muted-foreground">إدارة الصفحات والمحتوى</p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة صفحة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Globe className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">صفحات منشورة</p>
                <p className="text-2xl font-bold">{publishedPages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <FileText className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مسودات</p>
                <p className="text-2xl font-bold">{draftPages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gray-500/10">
                <Archive className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مؤرشفة</p>
                <p className="text-2xl font-bold">{archivedPages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val === 'pages') router.push('/admin/content/pages');
        else router.push(`/admin/content/${val}`);
      }}>
        <TabsList>
          <TabsTrigger value="pages">الصفحات ({publishedPages.length})</TabsTrigger>
          <TabsTrigger value="homepage">الصفحة الرئيسية</TabsTrigger>
          <TabsTrigger value="menus">القوائم</TabsTrigger>
          <TabsTrigger value="archived">مؤرشفة ({archivedPages.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Placeholder context for Homepage view */}
      {activeTab === 'homepage' && (
        <Card className="mt-4">
          <CardContent className="p-10 text-center text-muted-foreground">
            تخصيص الصفحة الرئيسية - سيتم برمجتها لاحقاً
          </CardContent>
        </Card>
      )}

      {/* Placeholder context for Menus view */}
      {activeTab === 'menus' && (
        <Card className="mt-4">
          <CardContent className="p-10 text-center text-muted-foreground">
            إدارة القوائم - سيتم برمجتها لاحقاً
          </CardContent>
        </Card>
      )}

      {(activeTab === 'pages' || activeTab === 'archived') && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالعنوان..."
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
                    <TableHead>العنوان</TableHead>
                    <TableHead>الرابط</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر تحديث</TableHead>
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
                  ) : getFilteredPages().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        لا توجد صفحات
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredPages().map((page) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{page.title}</p>
                              {page.title_ar && (
                                <p className="text-sm text-muted-foreground">
                                  {page.title_ar}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">/{page.slug}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              page.is_archived
                                ? 'bg-gray-500/10 text-gray-500'
                                : page.is_published
                                  ? 'bg-green-500/10 text-green-500'
                                  : 'bg-yellow-500/10 text-yellow-500'
                            }
                          >
                            {page.is_archived ? 'مؤرشفة' : page.is_published ? 'منشورة' : 'مسودة'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(page.updated_at), 'dd MMM yyyy', { locale: ar })}
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
                              <DropdownMenuItem onClick={() => openEditDialog(page)}>
                                <Pencil className="w-4 h-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/page/${page.slug}`, '_blank')}
                              >
                                <Eye className="w-4 h-4 ml-2" />
                                معاينة
                                <ExternalLink className="w-3 h-3 mr-auto" />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchive(page)}>
                                {page.is_archived ? (
                                  <>
                                    <RotateCcw className="w-4 h-4 ml-2" />
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
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? 'تعديل الصفحة' : 'إضافة صفحة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (English)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (العربية)</Label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الرابط (Slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="about-us"
              />
            </div>
            <div className="space-y-2">
              <Label>المحتوى</Label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
              />
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">إعدادات SEO</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>عنوان SEO</Label>
                  <Input
                    value={formData.seo_title}
                    onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف SEO</Label>
                  <Textarea
                    value={formData.seo_description}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_description: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>نشر الصفحة</Label>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {editingPage ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContent;
