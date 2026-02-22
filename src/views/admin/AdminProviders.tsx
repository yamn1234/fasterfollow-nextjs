import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  Server,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Provider {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  balance: number;
  currency: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

const AdminProviders = () => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    api_url: '',
    api_key: '',
    is_active: true,
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('api_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب المزودين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingProvider) {
        const { error } = await supabase
          .from('api_providers')
          .update({
            name: formData.name,
            api_url: formData.api_url,
            api_key: formData.api_key,
            is_active: formData.is_active,
          })
          .eq('id', editingProvider.id);

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم تحديث المزود' });
      } else {
        const { error } = await supabase
          .from('api_providers')
          .insert({
            name: formData.name,
            api_url: formData.api_url,
            api_key: formData.api_key,
            is_active: formData.is_active,
            user_id: user.id,
          });

        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم إضافة المزود' });
      }

      setDialogOpen(false);
      resetForm();
      fetchProviders();
    } catch (error) {
      console.error('Error saving provider:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حفظ المزود',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'تم بنجاح', description: 'تم حذف المزود' });
      fetchProviders();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حذف المزود',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', api_url: '', api_key: '', is_active: true });
    setEditingProvider(null);
  };

  const handleSyncBalance = async (provider: Provider) => {
    setSyncingId(provider.id);
    try {
      const response = await supabase.functions.invoke('sync-api-balance', {
        body: { providerId: provider.id },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.success) {
        toast({
          title: 'تم بنجاح',
          description: `الرصيد: $${result.balance} ${result.currency}`,
        });
        fetchProviders();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في مزامنة الرصيد',
        variant: 'destructive',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const openEditDialog = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      api_url: provider.api_url,
      api_key: provider.api_key,
      is_active: provider.is_active,
    });
    setDialogOpen(true);
  };

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المزودين و API</h1>
          <p className="text-muted-foreground">إدارة مزودي الخدمات الخارجية</p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة مزود
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Server className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المزودين</p>
                <p className="text-2xl font-bold">{providers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نشط</p>
                <p className="text-2xl font-bold">
                  {providers.filter((p) => p.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرصدة</p>
                <p className="text-2xl font-bold">
                  ${providers.reduce((sum, p) => sum + (p.balance || 0), 0).toFixed(2)}
                </p>
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
                <TableHead>المزود</TableHead>
                <TableHead>API URL</TableHead>
                <TableHead>الرصيد</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر مزامنة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    لا توجد نتائج
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Server className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{provider.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {provider.api_url}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        ${provider.balance?.toFixed(2) || '0.00'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          provider.is_active
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gray-500/10 text-gray-500'
                        }
                      >
                        {provider.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {provider.last_sync_at
                        ? format(new Date(provider.last_sync_at), 'dd MMM HH:mm', {
                            locale: ar,
                          })
                        : 'لم يتم'}
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
                          <DropdownMenuItem onClick={() => openEditDialog(provider)}>
                            <Pencil className="w-4 h-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleSyncBalance(provider)}
                            disabled={syncingId === provider.id}
                          >
                            {syncingId === provider.id ? (
                              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 ml-2" />
                            )}
                            مزامنة الرصيد
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(provider.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'تعديل المزود' : 'إضافة مزود جديد'}
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات المزود للاتصال بـ API
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المزود</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: SMM Provider"
              />
            </div>
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input
                value={formData.api_url}
                onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="••••••••••••"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>تفعيل المزود</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {editingProvider ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviders;
