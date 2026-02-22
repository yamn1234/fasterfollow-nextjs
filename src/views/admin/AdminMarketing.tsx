import { useState, useEffect } from 'react';
import {
  Plus,
  Megaphone,
  Gift,
  Users,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Announcement {
  id: string;
  title: string;
  title_ar: string | null;
  content: string | null;
  type: string;
  is_active: boolean;
  show_on_homepage: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  commission_rate: number;
  total_earnings: number;
  status: string;
  created_at: string;
}

import { useRouter } from 'next/navigation';

interface AdminMarketingProps {
  activeTab?: string;
}

const AdminMarketing = ({ activeTab: initialTab = 'announcements' }: AdminMarketingProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    content: '',
    content_ar: '',
    type: 'info',
    is_active: true,
    show_on_homepage: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [annRes, refRes] = await Promise.all([
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('referrals').select('*').order('created_at', { ascending: false }),
      ]);

      setAnnouncements(annRes.data || []);
      setReferrals(refRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: formData.title,
            title_ar: formData.title_ar,
            content: formData.content,
            content_ar: formData.content_ar,
            type: formData.type,
            is_active: formData.is_active,
            show_on_homepage: formData.show_on_homepage,
          })
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم تحديث الإعلان' });
      } else {
        const { error } = await supabase.from('announcements').insert({
          title: formData.title,
          title_ar: formData.title_ar,
          content: formData.content,
          content_ar: formData.content_ar,
          type: formData.type,
          is_active: formData.is_active,
          show_on_homepage: formData.show_on_homepage,
        });

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم إضافة الإعلان' });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حفظ الإعلان',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'تم بنجاح', description: 'تم حذف الإعلان' });
      fetchData();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حذف الإعلان',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      title_ar: '',
      content: '',
      content_ar: '',
      type: 'info',
      is_active: true,
      show_on_homepage: true,
    });
    setEditingAnnouncement(null);
  };

  const openEditDialog = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setFormData({
      title: ann.title,
      title_ar: ann.title_ar || '',
      content: ann.content || '',
      content_ar: '',
      type: ann.type || 'info',
      is_active: ann.is_active || false,
      show_on_homepage: ann.show_on_homepage || false,
    });
    setDialogOpen(true);
  };

  const typeConfig: Record<string, { label: string; color: string }> = {
    info: { label: 'معلومات', color: 'bg-blue-500/10 text-blue-500' },
    warning: { label: 'تحذير', color: 'bg-yellow-500/10 text-yellow-500' },
    success: { label: 'نجاح', color: 'bg-green-500/10 text-green-500' },
    error: { label: 'خطأ', color: 'bg-destructive/10 text-destructive' },
  };

  const totalEarnings = referrals.reduce((sum, r) => sum + (r.total_earnings || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التسويق والعروض</h1>
          <p className="text-muted-foreground">إدارة الإعلانات وبرنامج الإحالة</p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة إعلان
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Megaphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إعلانات نشطة</p>
                <p className="text-2xl font-bold">
                  {announcements.filter((a) => a.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإحالات</p>
                <p className="text-2xl font-bold">{referrals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Gift className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي عمولات الإحالة</p>
                <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val === 'announcements') router.push('/admin/marketing');
        else router.push(`/admin/marketing/${val}`);
      }}>
        <TabsList>
          <TabsTrigger value="announcements">الإعلانات</TabsTrigger>
          <TabsTrigger value="popups">النوافذ المنبثقة</TabsTrigger>
          <TabsTrigger value="referral">برنامج الإحالة</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
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
                  ) : announcements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        لا توجد إعلانات
                      </TableCell>
                    </TableRow>
                  ) : (
                    announcements.map((ann) => (
                      <TableRow key={ann.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Megaphone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{ann.title}</p>
                              {ann.title_ar && (
                                <p className="text-sm text-muted-foreground">
                                  {ann.title_ar}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeConfig[ann.type || 'info']?.color}>
                            {typeConfig[ann.type || 'info']?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              ann.is_active
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-gray-500/10 text-gray-500'
                            }
                          >
                            {ann.is_active ? 'نشط' : 'معطل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(ann.created_at), 'dd MMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(ann)}>
                                <Pencil className="w-4 h-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(ann.id)}
                              >
                                <Trash2 className="w-4 h-4 ml-2" />
                                حذف
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
        </TabsContent>

        <TabsContent value="popups" className="space-y-4">
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              قريباً - إدارة النوافذ المنبثقة
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referral" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المُحيل</TableHead>
                    <TableHead>المُحال</TableHead>
                    <TableHead>نسبة العمولة</TableHead>
                    <TableHead>إجمالي الأرباح</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        لا توجد إحالات
                      </TableCell>
                    </TableRow>
                  ) : (
                    referrals.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell className="font-mono text-sm">
                          {ref.referrer_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {ref.referred_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{(ref.commission_rate * 100).toFixed(0)}%</TableCell>
                        <TableCell>${ref.total_earnings?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              ref.status === 'active'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-gray-500/10 text-gray-500'
                            }
                          >
                            {ref.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(ref.created_at), 'dd MMM yyyy', { locale: ar })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
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
              <Label>المحتوى</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومات</SelectItem>
                  <SelectItem value="warning">تحذير</SelectItem>
                  <SelectItem value="success">نجاح</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>تفعيل الإعلان</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>عرض في الصفحة الرئيسية</Label>
              <Switch
                checked={formData.show_on_homepage}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_on_homepage: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {editingAnnouncement ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMarketing;
