import { useEffect, useState } from 'react';
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

const StatCard = ({ title, value, change, changeLabel, icon: Icon, trend = 'neutral', color = 'primary' }: StatCardProps) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : trend === 'down' ? (
                  <ArrowDownRight className="w-4 h-4 text-destructive" />
                ) : null}
                <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    todayOrders: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Sample data for charts
  const revenueData = [
    { name: 'يناير', value: 4000 },
    { name: 'فبراير', value: 3000 },
    { name: 'مارس', value: 5000 },
    { name: 'أبريل', value: 4500 },
    { name: 'مايو', value: 6000 },
    { name: 'يونيو', value: 5500 },
    { name: 'يوليو', value: 7000 },
  ];

  const ordersData = [
    { name: 'السبت', pending: 10, completed: 45 },
    { name: 'الأحد', pending: 15, completed: 52 },
    { name: 'الإثنين', pending: 8, completed: 38 },
    { name: 'الثلاثاء', pending: 12, completed: 48 },
    { name: 'الأربعاء', pending: 20, completed: 55 },
    { name: 'الخميس', pending: 18, completed: 60 },
    { name: 'الجمعة', pending: 25, completed: 70 },
  ];

  const serviceStats = [
    { name: 'Instagram', value: 40, color: '#E1306C' },
    { name: 'TikTok', value: 25, color: '#000000' },
    { name: 'Twitter', value: 15, color: '#1DA1F2' },
    { name: 'Facebook', value: 12, color: '#4267B2' },
    { name: 'YouTube', value: 8, color: '#FF0000' },
  ];

  const recentOrders = [
    { id: '#1234', user: 'أحمد محمد', service: 'متابعين انستغرام', amount: '$15.00', status: 'completed' },
    { id: '#1235', user: 'سارة علي', service: 'لايكات تيك توك', amount: '$8.50', status: 'processing' },
    { id: '#1236', user: 'محمد خالد', service: 'مشاهدات يوتيوب', amount: '$25.00', status: 'pending' },
    { id: '#1237', user: 'فاطمة أحمد', service: 'متابعين تويتر', amount: '$12.00', status: 'completed' },
    { id: '#1238', user: 'علي حسن', service: 'لايكات فيسبوك', amount: '$5.00', status: 'failed' },
  ];

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-500',
    processing: 'bg-blue-500/10 text-blue-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
    failed: 'bg-destructive/10 text-destructive',
  };

  const statusLabels: Record<string, string> = {
    completed: 'مكتمل',
    processing: 'قيد التنفيذ',
    pending: 'معلق',
    failed: 'فشل',
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch orders stats
        const { data: orders } = await supabase
          .from('orders')
          .select('status, price, created_at');

        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.price), 0) || 0;
        const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders?.filter(o => o.created_at.startsWith(today)).length || 0;

        setStats({
          totalUsers: userCount || 0,
          totalOrders,
          totalRevenue,
          pendingOrders,
          todayOrders,
          monthlyRevenue: totalRevenue * 0.3, // Sample calculation
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">نظرة عامة</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة إدارة SMM Panel</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">تصدير التقرير</Button>
          <Button className="gradient-primary text-primary-foreground">إضافة طلب</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.totalUsers.toLocaleString()}
          change={12}
          changeLabel="من الشهر الماضي"
          icon={Users}
          trend="up"
          color="primary"
        />
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders.toLocaleString()}
          change={8}
          changeLabel="من الشهر الماضي"
          icon={ShoppingCart}
          trend="up"
          color="success"
        />
        <StatCard
          title="إجمالي الإيرادات"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change={15}
          changeLabel="من الشهر الماضي"
          icon={DollarSign}
          trend="up"
          color="primary"
        />
        <StatCard
          title="طلبات معلقة"
          value={stats.pendingOrders}
          change={-5}
          changeLabel="من أمس"
          icon={Clock}
          trend="down"
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات الشهرية</CardTitle>
            <CardDescription>إجمالي الإيرادات خلال الأشهر الماضية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>حالة الطلبات</CardTitle>
            <CardDescription>توزيع الطلبات خلال الأسبوع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="completed" name="مكتملة" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="معلقة" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>آخر الطلبات</CardTitle>
              <CardDescription>أحدث 5 طلبات في النظام</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.user}</p>
                      <p className="text-sm text-muted-foreground">{order.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{order.amount}</span>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الخدمات</CardTitle>
            <CardDescription>حسب المنصة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {serviceStats.map((stat) => (
                <div key={stat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                    <span className="text-sm">{stat.name}</span>
                  </div>
                  <span className="text-sm font-medium">{stat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
