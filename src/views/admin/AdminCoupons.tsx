import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Copy, Gift, Percent, RefreshCw, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Coupon {
  id: string;
  code: string;
  coupon_type: string;
  discount_type: string;
  discount_value: number;
  balance_amount: number | null;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  uses_count: number | null;
  min_order_amount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    coupon_type: 'balance' as 'discount' | 'balance',
    discount_type: 'percentage',
    discount_value: 0,
    balance_amount: 0,
    description: '',
    is_active: true,
    max_uses: '',
    min_order_amount: '',
    starts_at: '',
    expires_at: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('فشل في جلب الكوبونات');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const resetForm = () => {
    setFormData({
      code: '',
      coupon_type: 'balance',
      discount_type: 'percentage',
      discount_value: 0,
      balance_amount: 0,
      description: '',
      is_active: true,
      max_uses: '',
      min_order_amount: '',
      starts_at: '',
      expires_at: '',
    });
    setEditingCoupon(null);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      coupon_type: coupon.coupon_type as 'discount' | 'balance',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      balance_amount: coupon.balance_amount || 0,
      description: coupon.description || '',
      is_active: coupon.is_active,
      max_uses: coupon.max_uses?.toString() || '',
      min_order_amount: coupon.min_order_amount?.toString() || '',
      starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast.error('يرجى إدخال كود الكوبون');
      return;
    }

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        coupon_type: formData.coupon_type,
        discount_type: formData.discount_type,
        discount_value: formData.coupon_type === 'discount' ? formData.discount_value : 0,
        balance_amount: formData.coupon_type === 'balance' ? formData.balance_amount : 0,
        description: formData.description || null,
        is_active: formData.is_active,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        starts_at: formData.starts_at || null,
        expires_at: formData.expires_at || null,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        
        if (error) throw error;
        toast.success('تم تحديث الكوبون بنجاح');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);
        
        if (error) throw error;
        toast.success('تم إنشاء الكوبون بنجاح');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      if (error.code === '23505') {
        toast.error('هذا الكود مستخدم بالفعل');
      } else {
        toast.error('فشل في حفظ الكوبون');
      }
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('تم حذف الكوبون بنجاح');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('فشل في حذف الكوبون');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(currentStatus ? 'تم تعطيل الكوبون' : 'تم تفعيل الكوبون');
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('فشل في تحديث الحالة');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود');
  };

  const balanceCoupons = coupons.filter(c => c.coupon_type === 'balance');
  const discountCoupons = coupons.filter(c => c.coupon_type === 'discount');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الكوبونات</h1>
          <p className="text-muted-foreground">إنشاء وإدارة كوبونات الشحن والخصم</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCoupons}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                كوبون جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'تعديل الكوبون' : 'إنشاء كوبون جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Code */}
                <div className="space-y-2">
                  <Label>كود الكوبون</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="مثال: SAVE20"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      توليد
                    </Button>
                  </div>
                </div>

                {/* Coupon Type */}
                <div className="space-y-2">
                  <Label>نوع الكوبون</Label>
                  <Select
                    value={formData.coupon_type}
                    onValueChange={(value: 'discount' | 'balance') => 
                      setFormData({ ...formData, coupon_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balance">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          كوبون شحن رصيد
                        </div>
                      </SelectItem>
                      <SelectItem value="discount">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          كوبون خصم
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Balance Amount - for balance coupons */}
                {formData.coupon_type === 'balance' && (
                  <div className="space-y-2">
                    <Label>مبلغ الشحن ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.balance_amount}
                      onChange={(e) => setFormData({ ...formData, balance_amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Discount settings - for discount coupons */}
                {formData.coupon_type === 'discount' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>نوع الخصم</Label>
                        <Select
                          value={formData.discount_type}
                          onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                            <SelectItem value="fixed">مبلغ ثابت ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>قيمة الخصم</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.discount_value}
                          onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>الحد الأدنى للطلب ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                        placeholder="اختياري"
                      />
                    </div>
                  </>
                )}

                {/* Usage limit */}
                <div className="space-y-2">
                  <Label>الحد الأقصى للاستخدام</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="غير محدود"
                  />
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ البدء</Label>
                    <Input
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ الانتهاء</Label>
                    <Input
                      type="date"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>وصف (اختياري)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="ملاحظات للإدارة..."
                    rows={2}
                  />
                </div>

                {/* Active status */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>تفعيل الكوبون</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingCoupon ? 'تحديث' : 'إنشاء'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الكوبونات</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Gift className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">كوبونات الشحن</p>
                <p className="text-2xl font-bold">{balanceCoupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Percent className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">كوبونات الخصم</p>
                <p className="text-2xl font-bold">{discountCoupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الكوبونات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد كوبونات</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>الاستخدام</TableHead>
                    <TableHead>الصلاحية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {coupon.code}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copyCode(coupon.code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.coupon_type === 'balance' ? 'default' : 'secondary'}>
                          {coupon.coupon_type === 'balance' ? (
                            <><Gift className="w-3 h-3 ml-1" /> شحن</>
                          ) : (
                            <><Percent className="w-3 h-3 ml-1" /> خصم</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {coupon.coupon_type === 'balance' ? (
                          <span className="text-green-600 font-medium">${coupon.balance_amount}</span>
                        ) : (
                          <span>
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}%` 
                              : `$${coupon.discount_value}`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={coupon.max_uses && coupon.uses_count >= coupon.max_uses ? 'text-destructive' : ''}>
                          {coupon.uses_count} / {coupon.max_uses || '∞'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {coupon.expires_at ? (
                          <span className={new Date(coupon.expires_at) < new Date() ? 'text-destructive' : ''}>
                            {format(new Date(coupon.expires_at), 'dd/MM/yyyy', { locale: ar })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">غير محدد</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={() => toggleActive(coupon.id, coupon.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(coupon)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteCoupon(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
