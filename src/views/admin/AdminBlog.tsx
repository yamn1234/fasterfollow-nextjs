import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  BookOpen,
  Eye,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Loader2,
  Calendar,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: string;
  is_archived: boolean;
  category_id: string | null;
  views_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  published_at: string | null;
}

interface BlogCategory {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
}

import { useRouter } from 'next/navigation';

interface AdminBlogProps {
  activeTab?: string;
}

const AdminBlog = ({ activeTab: initialTab = 'posts' }: AdminBlogProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    category_id: '',
    seo_title: '',
    seo_description: '',
    is_indexable: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, catsRes] = await Promise.all([
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('blog_categories').select('*').order('name'),
      ]);

      setPosts(postsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const postData = {
        title: formData.title,
        title_ar: formData.title_ar || null,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: formData.content || null,
        status: formData.status,
        category_id: formData.category_id || null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        is_indexable: formData.is_indexable,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم تحديث المقال' });
      } else {
        const { error } = await supabase.from('blog_posts').insert({
          ...postData,
          author_id: user.id,
        });

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم إضافة المقال' });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حفظ المقال',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          is_archived: !post.is_archived,
          archived_at: post.is_archived ? null : new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) throw error;
      toast({
        title: 'تم بنجاح',
        description: post.is_archived ? 'تم استعادة المقال' : 'تم أرشفة المقال',
      });
      fetchData();
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
      excerpt: '',
      content: '',
      status: 'draft',
      category_id: '',
      seo_title: '',
      seo_description: '',
      is_indexable: true,
    });
    setEditingPost(null);
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      title_ar: post.title_ar || '',
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      status: post.status || 'draft',
      category_id: post.category_id || '',
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      is_indexable: true,
    });
    setDialogOpen(true);
  };

  const publishedPosts = posts.filter((p) => !p.is_archived && p.status === 'published');
  const draftPosts = posts.filter((p) => !p.is_archived && p.status === 'draft');
  const archivedPosts = posts.filter((p) => p.is_archived);

  const getFilteredPosts = () => {
    let filtered = posts;
    switch (activeTab) {
      case 'posts':
        filtered = publishedPosts;
        break;
      case 'drafts':
        filtered = draftPosts;
        break;
      case 'archived':
        filtered = archivedPosts;
        break;
    }
    return filtered.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    published: { label: 'منشور', color: 'bg-green-500/10 text-green-500' },
    draft: { label: 'مسودة', color: 'bg-yellow-500/10 text-yellow-500' },
    scheduled: { label: 'مجدول', color: 'bg-blue-500/10 text-blue-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المدونة</h1>
          <p className="text-muted-foreground">إدارة المقالات والفئات</p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة مقال
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <BookOpen className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">منشورة</p>
                <p className="text-2xl font-bold">{publishedPosts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Pencil className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مسودات</p>
                <p className="text-2xl font-bold">{draftPosts.length}</p>
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
                <p className="text-2xl font-bold">{archivedPosts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
                <p className="text-2xl font-bold">
                  {posts.reduce((sum, p) => sum + (p.views_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val === 'posts') router.push('/admin/blog');
        else router.push(`/admin/blog/${val}`);
      }}>
        <TabsList>
          <TabsTrigger value="posts">المقالات ({publishedPosts.length})</TabsTrigger>
          <TabsTrigger value="categories">الفئات ({categories.length})</TabsTrigger>
          <TabsTrigger value="drafts">مسودات ({draftPosts.length})</TabsTrigger>
          <TabsTrigger value="archived">مؤرشفة ({archivedPosts.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Placeholder context for Categories view */}
      {activeTab === 'categories' && (
        <Card className="mt-4">
          <CardContent className="p-10 text-center text-muted-foreground">
            إدارة الفئات - سيتم إضافتها لاحقاً
          </CardContent>
        </Card>
      )}

      {activeTab !== 'categories' && (
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
                    <TableHead>المقال</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المشاهدات</TableHead>
                    <TableHead>التاريخ</TableHead>
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
                  ) : getFilteredPosts().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        لا توجد مقالات
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredPosts().map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className="text-sm text-muted-foreground">/{post.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              post.is_archived
                                ? 'bg-gray-500/10 text-gray-500'
                                : statusConfig[post.status || 'draft']?.color
                            }
                          >
                            {post.is_archived
                              ? 'مؤرشف'
                              : statusConfig[post.status || 'draft']?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{post.views_count || 0}</TableCell>
                        <TableCell>
                          {format(new Date(post.created_at), 'dd MMM yyyy', { locale: ar })}
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
                              <DropdownMenuItem onClick={() => openEditDialog(post)}>
                                <Pencil className="w-4 h-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              >
                                <Eye className="w-4 h-4 ml-2" />
                                معاينة
                                <ExternalLink className="w-3 h-3 mr-auto" />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchive(post)}>
                                {post.is_archived ? (
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
              {editingPost ? 'تعديل المقال' : 'إضافة مقال جديد'}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الرابط (Slug)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الفئة</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(v) => setFormData({ ...formData, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر فئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الملخص</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
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
                <div className="flex items-center justify-between">
                  <Label>قابل للفهرسة (Index)</Label>
                  <Switch
                    checked={formData.is_indexable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_indexable: checked })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>حالة المقال</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="scheduled">مجدول</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {editingPost ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
