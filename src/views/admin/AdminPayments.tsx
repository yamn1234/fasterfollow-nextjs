import { useState, useEffect } from 'react';
import {
  Search,
  Download,
  CreditCard,
  DollarSign,
  TrendingUp,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
  ArrowUpDown,
  Gift,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import GatewaySortDialog from '@/components/admin/GatewaySortDialog';
import ImageIconPicker from '@/components/admin/ImageIconPicker';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  payment_method: string | null;
  created_at: string;
}

interface PaymentGateway {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  fee_percentage: number;
  fee_fixed: number;
  min_amount: number;
  max_amount: number;
  redirect_url: string | null;
  instructions: string | null;
  instructions_ar: string | null;
  gateway_type: string | null;
  sort_order: number | null;
  image_url: string | null;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
}

interface BonusSetting {
  id: string;
  min_amount: number;
  bonus_percentage: number;
  is_active: boolean;
  sort_order: number;
}

import { useRouter } from 'next/navigation';

interface AdminPaymentsProps {
  activeTab?: string;
}

const AdminPayments = ({ activeTab: initialTab = 'transactions' }: AdminPaymentsProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bonusSettings, setBonusSettings] = useState<BonusSetting[]>([]);
  const [bonusEnabled, setBonusEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [gatewayDialogOpen, setGatewayDialogOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [gatewayFormData, setGatewayFormData] = useState({
    name: '',
    slug: '',
    gateway_type: 'manual',
    redirect_url: '',
    instructions: '',
    instructions_ar: '',
    fee_percentage: '0',
    fee_fixed: '0',
    min_amount: '1',
    max_amount: '10000',
    is_active: true,
    image_url: '',
  });
  const [sortDialogOpen, setSortDialogOpen] = useState(false);

  // Bonus form state
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<BonusSetting | null>(null);
  const [bonusFormData, setBonusFormData] = useState({
    min_amount: '0',
    bonus_percentage: '0',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, gatewaysRes, couponsRes, bonusRes, bonusEnabledRes] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('payment_gateways').select('*').order('sort_order'),
        supabase.from('coupons').select('*').order('created_at', { ascending: false }),
        supabase.from('bonus_settings').select('*').order('sort_order'),
        supabase.from('site_settings').select('value').eq('key', 'bonus_enabled').single(),
      ]);

      setTransactions(transRes.data || []);
      setGateways(gatewaysRes.data || []);
      setCoupons(couponsRes.data || []);
      setBonusSettings(bonusRes.data || []);

      if (bonusEnabledRes.data?.value !== undefined) {
        setBonusEnabled(bonusEnabledRes.data.value === true || bonusEnabledRes.data.value === 'true');
      }
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSaveGateway = async () => {
    if (!gatewayFormData.name.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم طريقة الدفع',
        variant: 'destructive',
      });
      return;
    }

    try {
      const slug = gatewayFormData.slug || generateSlug(gatewayFormData.name);

      const gatewayData = {
        name: gatewayFormData.name.trim(),
        slug: slug,
        gateway_type: gatewayFormData.gateway_type,
        redirect_url: gatewayFormData.redirect_url.trim() || null,
        instructions: gatewayFormData.instructions.trim() || null,
        instructions_ar: gatewayFormData.instructions_ar.trim() || null,
        fee_percentage: parseFloat(gatewayFormData.fee_percentage) || 0,
        fee_fixed: parseFloat(gatewayFormData.fee_fixed) || 0,
        min_amount: parseFloat(gatewayFormData.min_amount) || 1,
        max_amount: parseFloat(gatewayFormData.max_amount) || 10000,
        is_active: gatewayFormData.is_active,
        image_url: gatewayFormData.image_url.trim() || null,
      };

      if (selectedGateway) {
        const { error } = await supabase
          .from('payment_gateways')
          .update(gatewayData)
          .eq('id', selectedGateway.id);
        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم تحديث طريقة الدفع' });
      } else {
        const { error } = await supabase
          .from('payment_gateways')
          .insert(gatewayData);
        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم إضافة طريقة الدفع' });
      }

      setGatewayDialogOpen(false);
      resetGatewayForm();
      fetchData();
    } catch (error: any) {
      console.error('Gateway save error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في حفظ طريقة الدفع',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGateway = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) return;

    try {
      const { error } = await supabase
        .from('payment_gateways')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'تم بنجاح', description: 'تم حذف طريقة الدفع' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في الحذف',
        variant: 'destructive',
      });
    }
  };

  const resetGatewayForm = () => {
    setGatewayFormData({
      name: '',
      slug: '',
      gateway_type: 'manual',
      redirect_url: '',
      instructions: '',
      instructions_ar: '',
      fee_percentage: '0',
      fee_fixed: '0',
      min_amount: '1',
      max_amount: '10000',
      is_active: true,
      image_url: '',
    });
    setSelectedGateway(null);
  };

  const openEditGateway = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setGatewayFormData({
      name: gateway.name,
      slug: gateway.slug,
      gateway_type: gateway.gateway_type || 'manual',
      redirect_url: gateway.redirect_url || '',
      instructions: gateway.instructions || '',
      instructions_ar: gateway.instructions_ar || '',
      fee_percentage: gateway.fee_percentage.toString(),
      fee_fixed: gateway.fee_fixed.toString(),
      min_amount: gateway.min_amount.toString(),
      max_amount: gateway.max_amount.toString(),
      is_active: gateway.is_active,
      image_url: gateway.image_url || '',
    });
    setGatewayDialogOpen(true);
  };

  const toggleGatewayActive = async (gateway: PaymentGateway) => {
    try {
      const { error } = await supabase
        .from('payment_gateways')
        .update({ is_active: !gateway.is_active })
        .eq('id', gateway.id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  // Bonus functions
  const handleToggleBonusEnabled = async () => {
    try {
      const newValue = !bonusEnabled;
      const { error } = await supabase
        .from('site_settings')
        .update({ value: newValue })
        .eq('key', 'bonus_enabled');

      if (error) throw error;

      setBonusEnabled(newValue);
      toast({
        title: 'تم بنجاح',
        description: newValue ? 'تم تفعيل نظام البونص' : 'تم تعطيل نظام البونص'
      });
    } catch (error) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const handleSaveBonus = async () => {
    try {
      const bonusData = {
        min_amount: parseFloat(bonusFormData.min_amount) || 0,
        bonus_percentage: parseFloat(bonusFormData.bonus_percentage) || 0,
        is_active: bonusFormData.is_active,
      };

      if (selectedBonus) {
        const { error } = await supabase
          .from('bonus_settings')
          .update(bonusData)
          .eq('id', selectedBonus.id);
        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم تحديث البونص' });
      } else {
        const maxOrder = Math.max(...bonusSettings.map(b => b.sort_order || 0), 0);
        const { error } = await supabase
          .from('bonus_settings')
          .insert({ ...bonusData, sort_order: maxOrder + 1 });
        if (error) throw error;
        toast({ title: 'تم بنجاح', description: 'تم إضافة البونص' });
      }

      setBonusDialogOpen(false);
      resetBonusForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في حفظ البونص',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBonus = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البونص؟')) return;

    try {
      const { error } = await supabase
        .from('bonus_settings')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'تم بنجاح', description: 'تم حذف البونص' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في الحذف',
        variant: 'destructive',
      });
    }
  };

  const resetBonusForm = () => {
    setBonusFormData({
      min_amount: '0',
      bonus_percentage: '0',
      is_active: true,
    });
    setSelectedBonus(null);
  };

  const openEditBonus = (bonus: BonusSetting) => {
    setSelectedBonus(bonus);
    setBonusFormData({
      min_amount: bonus.min_amount.toString(),
      bonus_percentage: bonus.bonus_percentage.toString(),
      is_active: bonus.is_active,
    });
    setBonusDialogOpen(true);
  };

  const toggleBonusActive = async (bonus: BonusSetting) => {
    try {
      const { error } = await supabase
        .from('bonus_settings')
        .update({ is_active: !bonus.is_active })
        .eq('id', bonus.id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const typeConfig: Record<string, { label: string; color: string }> = {
    deposit: { label: 'إيداع', color: 'bg-green-500/10 text-green-500' },
    purchase: { label: 'شراء', color: 'bg-blue-500/10 text-blue-500' },
    refund: { label: 'استرداد', color: 'bg-cyan-500/10 text-cyan-500' },
    bonus: { label: 'مكافأة', color: 'bg-purple-500/10 text-purple-500' },
    manual: { label: 'يدوي', color: 'bg-yellow-500/10 text-yellow-500' },
    referral: { label: 'إحالة', color: 'bg-pink-500/10 text-pink-500' },
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPurchases = transactions
    .filter((t) => t.type === 'purchase')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المدفوعات</h1>
          <p className="text-muted-foreground">إدارة المعاملات وبوابات الدفع</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 ml-2" />
          تصدير التقرير
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيداعات</p>
                <p className="text-2xl font-bold">${totalDeposits.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
                <p className="text-2xl font-bold">${totalPurchases.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">بوابات نشطة</p>
                <p className="text-2xl font-bold">
                  {gateways.filter((g) => g.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <CheckCircle className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">كوبونات نشطة</p>
                <p className="text-2xl font-bold">
                  {coupons.filter((c) => c.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        if (val === 'transactions') router.push('/admin/payments');
        else router.push(`/admin/payments/${val}`);
      }} className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="gateways">طرق الدفع</TabsTrigger>
          <TabsTrigger value="bonus">البونص</TabsTrigger>
          <TabsTrigger value="coupons">الكوبونات</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="نوع المعاملة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم المعاملة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الرصيد قبل</TableHead>
                    <TableHead>الرصيد بعد</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        لا توجد معاملات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((trans) => (
                      <TableRow key={trans.id}>
                        <TableCell className="font-mono text-sm">
                          #{trans.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge className={typeConfig[trans.type]?.color || ''}>
                            {typeConfig[trans.type]?.label || trans.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              trans.amount >= 0 ? 'text-green-500' : 'text-destructive'
                            }
                          >
                            {trans.amount >= 0 ? '+' : ''}${trans.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>${trans.balance_before.toFixed(2)}</TableCell>
                        <TableCell>${trans.balance_after.toFixed(2)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {trans.description || '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(trans.created_at), 'dd MMM HH:mm', {
                            locale: ar,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gateways" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSortDialogOpen(true)}
            >
              <ArrowUpDown className="w-4 h-4 ml-2" />
              ترتيب طرق الدفع
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={() => {
                resetGatewayForm();
                setGatewayDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة طريقة دفع
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البوابة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الرسوم</TableHead>
                    <TableHead>الحدود</TableHead>
                    <TableHead>الرابط</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gateways.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        لا توجد طرق دفع
                      </TableCell>
                    </TableRow>
                  ) : (
                    gateways.map((gateway) => (
                      <TableRow key={gateway.id}>
                        <TableCell className="font-medium">{gateway.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {gateway.gateway_type === 'manual' ? 'يدوي' : 'تلقائي'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {gateway.fee_percentage}% + ${gateway.fee_fixed}
                        </TableCell>
                        <TableCell>
                          ${gateway.min_amount} - ${gateway.max_amount}
                        </TableCell>
                        <TableCell>
                          {gateway.redirect_url ? (
                            <a
                              href={gateway.redirect_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="w-3 h-3" />
                              رابط
                            </a>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={gateway.is_active}
                            onCheckedChange={() => toggleGatewayActive(gateway)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditGateway(gateway)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteGateway(gateway.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bonus Tab */}
        <TabsContent value="bonus" className="space-y-4">
          <div className="flex justify-between items-center">
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/10">
                      <Gift className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">نظام البونص</p>
                      <p className="text-sm text-muted-foreground">
                        {bonusEnabled ? 'مفعل - يظهر للعملاء' : 'معطل - مخفي عن العملاء'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={bonusEnabled}
                    onCheckedChange={handleToggleBonusEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={() => {
                resetBonusForm();
                setBonusDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة بونص جديد
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                مستويات البونص
              </CardTitle>
              <CardDescription>
                عند شحن مبلغ يساوي أو يتجاوز الحد الأدنى، يحصل العميل على نسبة البونص المحددة
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحد الأدنى ($)</TableHead>
                    <TableHead>نسبة البونص (%)</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonusSettings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        لا توجد مستويات بونص
                      </TableCell>
                    </TableRow>
                  ) : (
                    bonusSettings
                      .sort((a, b) => a.min_amount - b.min_amount)
                      .map((bonus) => (
                        <TableRow key={bonus.id}>
                          <TableCell className="font-bold">${bonus.min_amount}</TableCell>
                          <TableCell>
                            <Badge className="bg-purple-500/10 text-purple-500">
                              +{bonus.bonus_percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={bonus.is_active}
                              onCheckedChange={() => toggleBonusActive(bonus)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditBonus(bonus)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteBonus(bonus.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الخصم</TableHead>
                    <TableHead>الاستخدام</TableHead>
                    <TableHead>تاريخ الانتهاء</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10">
                        لا توجد كوبونات
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-bold">
                          {coupon.code}
                        </TableCell>
                        <TableCell>
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}%`
                            : `$${coupon.discount_value}`}
                        </TableCell>
                        <TableCell>
                          {coupon.uses_count} / {coupon.max_uses || '∞'}
                        </TableCell>
                        <TableCell>
                          {coupon.expires_at
                            ? format(new Date(coupon.expires_at), 'dd MMM yyyy', {
                              locale: ar,
                            })
                            : 'غير محدد'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              coupon.is_active
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-gray-500/10 text-gray-500'
                            }
                          >
                            {coupon.is_active ? 'نشط' : 'معطل'}
                          </Badge>
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

      {/* Bonus Dialog */}
      <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBonus ? 'تعديل البونص' : 'إضافة بونص جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الحد الأدنى للمبلغ ($)</Label>
              <Input
                type="number"
                value={bonusFormData.min_amount}
                onChange={(e) =>
                  setBonusFormData({ ...bonusFormData, min_amount: e.target.value })
                }
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                عندما يشحن العميل هذا المبلغ أو أكثر، يحصل على البونص
              </p>
            </div>
            <div className="space-y-2">
              <Label>نسبة البونص (%)</Label>
              <Input
                type="number"
                value={bonusFormData.bonus_percentage}
                onChange={(e) =>
                  setBonusFormData({ ...bonusFormData, bonus_percentage: e.target.value })
                }
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                مثال: إذا شحن $100 والبونص 10%، يحصل على $10 إضافية
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label>نشط</Label>
              <Switch
                checked={bonusFormData.is_active}
                onCheckedChange={(checked) =>
                  setBonusFormData({ ...bonusFormData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBonusDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveBonus}>
              {selectedBonus ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gateway Sort Dialog */}
      <GatewaySortDialog
        open={sortDialogOpen}
        onOpenChange={setSortDialogOpen}
        gateways={gateways}
        onSorted={fetchData}
      />

      {/* Gateway Dialog */}
      <Dialog open={gatewayDialogOpen} onOpenChange={setGatewayDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedGateway ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Picker */}
            <ImageIconPicker
              value={gatewayFormData.image_url}
              onChange={(value) => setGatewayFormData({ ...gatewayFormData, image_url: value || '' })}
              label="صورة طريقة الدفع"
              folder="payment-gateways"
              showEmojiPicker={false}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input
                  value={gatewayFormData.name}
                  onChange={(e) => {
                    setGatewayFormData({
                      ...gatewayFormData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="PayPal, Vodafone Cash..."
                />
              </div>
              <div className="space-y-2">
                <Label>الرابط (Slug)</Label>
                <Input
                  value={gatewayFormData.slug}
                  onChange={(e) =>
                    setGatewayFormData({ ...gatewayFormData, slug: e.target.value })
                  }
                  placeholder="paypal"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>النوع</Label>
              <Select
                value={gatewayFormData.gateway_type}
                onValueChange={(v) =>
                  setGatewayFormData({ ...gatewayFormData, gateway_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">يدوي (تحويل لرابط خارجي)</SelectItem>
                  <SelectItem value="automatic">تلقائي (API)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {gatewayFormData.gateway_type === 'manual' && (
              <>
                <div className="space-y-2">
                  <Label>رابط التحويل</Label>
                  <Input
                    value={gatewayFormData.redirect_url}
                    onChange={(e) =>
                      setGatewayFormData({ ...gatewayFormData, redirect_url: e.target.value })
                    }
                    placeholder="https://payment-link.com/..."
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيتم توجيه المستخدم لهذا الرابط عند اختيار طريقة الدفع
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تعليمات (إنجليزي)</Label>
                    <Textarea
                      value={gatewayFormData.instructions}
                      onChange={(e) =>
                        setGatewayFormData({ ...gatewayFormData, instructions: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تعليمات (عربي)</Label>
                    <Textarea
                      value={gatewayFormData.instructions_ar}
                      onChange={(e) =>
                        setGatewayFormData({ ...gatewayFormData, instructions_ar: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نسبة الرسوم (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={gatewayFormData.fee_percentage}
                  onChange={(e) =>
                    setGatewayFormData({ ...gatewayFormData, fee_percentage: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>رسوم ثابتة ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={gatewayFormData.fee_fixed}
                  onChange={(e) =>
                    setGatewayFormData({ ...gatewayFormData, fee_fixed: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأدنى ($)</Label>
                <Input
                  type="number"
                  value={gatewayFormData.min_amount}
                  onChange={(e) =>
                    setGatewayFormData({ ...gatewayFormData, min_amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى ($)</Label>
                <Input
                  type="number"
                  value={gatewayFormData.max_amount}
                  onChange={(e) =>
                    setGatewayFormData({ ...gatewayFormData, max_amount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>نشط</Label>
              <Switch
                checked={gatewayFormData.is_active}
                onCheckedChange={(checked) =>
                  setGatewayFormData({ ...gatewayFormData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGatewayDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveGateway}>
              {selectedGateway ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
