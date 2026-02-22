import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Download,
  Ban,
  Wallet,
  Key,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  balance: number;
  avatar_url: string | null;
  created_at: string;
  email?: string;
  role?: string;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'add' | 'subtract'>('add');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        return;
      }

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          return {
            ...profile,
            role: roleData?.role || 'user',
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب المستخدمين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !balanceAmount) return;

    const amount = parseFloat(balanceAmount);
    const newBalance = balanceAction === 'add'
      ? selectedUser.balance + amount
      : selectedUser.balance - amount;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: selectedUser.user_id,
        type: 'manual',
        amount: balanceAction === 'add' ? amount : -amount,
        balance_before: selectedUser.balance,
        balance_after: newBalance,
        description: balanceAction === 'add' ? 'إضافة رصيد يدوي' : 'خصم رصيد يدوي',
      });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الرصيد بنجاح',
      });

      setBalanceDialogOpen(false);
      setBalanceAmount('');
      fetchUsers();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحديث الرصيد',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-primary/10 text-primary',
    moderator: 'bg-blue-500/10 text-blue-500',
    support: 'bg-purple-500/10 text-purple-500',
    user: 'bg-secondary text-secondary-foreground',
  };

  const roleLabels: Record<string, string> = {
    admin: 'مدير',
    moderator: 'مشرف',
    support: 'دعم',
    user: 'مستخدم',
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspension_reason: suspensionReason || 'تم تعليق الحساب بواسطة المدير',
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم تعليق الحساب بنجاح',
      });

      setSuspendDialogOpen(false);
      setSuspensionReason('');
      fetchUsers();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تعليق الحساب',
        variant: 'destructive',
      });
    }
  };

  const handleUnsuspendUser = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
          suspension_reason: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم إلغاء تعليق الحساب بنجاح',
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في إلغاء تعليق الحساب',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">إدارة وعرض جميع المستخدمين</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
          <Button className="gradient-primary text-primary-foreground">
            <UserPlus className="w-4 h-4 ml-2" />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية حسب الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="moderator">مشرف</SelectItem>
                <SelectItem value="support">دعم</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || 'بدون اسم'}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {user.user_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role || 'user']}>
                          {roleLabels[user.role || 'user']}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">${user.balance.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        {user.is_suspended ? (
                          <Badge className="bg-red-500/10 text-red-500">معلق</Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-500">نشط</Badge>
                        )}
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
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="w-4 h-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setBalanceDialogOpen(true);
                              }}
                            >
                              <Wallet className="w-4 h-4 ml-2" />
                              تعديل الرصيد
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="w-4 h-4 ml-2" />
                              إعادة تعيين كلمة المرور
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_suspended ? (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleUnsuspendUser(user)}
                              >
                                <Ban className="w-4 h-4 ml-2" />
                                إلغاء تعليق الحساب
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-yellow-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSuspendDialogOpen(true);
                                }}
                              >
                                <Ban className="w-4 h-4 ml-2" />
                                تعليق الحساب
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
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
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              عرض {filteredUsers.length} من {users.length} مستخدم
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                1
              </Button>
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الرصيد</DialogTitle>
            <DialogDescription>
              تعديل رصيد المستخدم: {selectedUser?.full_name || 'بدون اسم'}
              <br />
              الرصيد الحالي: ${selectedUser?.balance.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نوع العملية</Label>
              <Select
                value={balanceAction}
                onValueChange={(v) => setBalanceAction(v as 'add' | 'subtract')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">إضافة رصيد</SelectItem>
                  <SelectItem value="subtract">خصم رصيد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleBalanceUpdate}>
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعليق الحساب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من تعليق حساب المستخدم: {selectedUser?.full_name || 'بدون اسم'}؟
              <br />
              لن يتمكن المستخدم من تسجيل الدخول حتى يتم إلغاء التعليق.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>سبب التعليق (اختياري)</Label>
              <Input
                placeholder="أدخل سبب تعليق الحساب..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleSuspendUser}>
              تعليق الحساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
