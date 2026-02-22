import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const AdminProfile = () => {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الملف الشخصي</h1>
        <p className="text-muted-foreground">معلومات حساب الأدمن الحالي</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الحساب</CardTitle>
          <CardDescription>عرض سريع لبيانات تسجيل الدخول والملف</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || user?.email || 'Admin'} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold">{profile?.full_name || 'Admin'}</p>
              <Badge variant="outline">Admin</Badge>
            </div>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {user?.email || '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ملاحظة</CardTitle>
          <CardDescription>
            لو ظهرت لك صفحة "غير موجود" سابقاً عند فتح الملف الشخصي، تم إصلاح المسار الآن.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default AdminProfile;
