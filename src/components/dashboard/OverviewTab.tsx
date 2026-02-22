import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ArrowUpLeft,
  ArrowUpRight,
  Plus,
  Loader2,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";

interface Order {
  id: string;
  order_number: number;
  quantity: number;
  status: string;
  created_at: string;
  service: {
    name: string;
    name_ar: string | null;
  } | null;
}

interface OrderStats {
  total: number;
  completed: number;
  inProgress: number;
}

interface OverviewTabProps {
  onNavigate?: (tab: string) => void;
}

const OverviewTab = ({ onNavigate }: OverviewTabProps) => {
  const { profile, user } = useAuth();
  const { t, isArabic } = useTranslation();
  const { format } = useCurrency();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({ total: 0, completed: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: isArabic ? "في الانتظار" : "Pending", color: "bg-yellow-500" },
    processing: { label: isArabic ? "قيد المعالجة" : "Processing", color: "bg-blue-500" },
    in_progress: { label: isArabic ? "قيد التنفيذ" : "In Progress", color: "bg-orange-500" },
    completed: { label: isArabic ? "مكتمل" : "Completed", color: "bg-green-500" },
    partial: { label: isArabic ? "جزئي" : "Partial", color: "bg-purple-500" },
    cancelled: { label: isArabic ? "ملغي" : "Cancelled", color: "bg-gray-500" },
    refunded: { label: isArabic ? "مسترد" : "Refunded", color: "bg-blue-400" },
    failed: { label: isArabic ? "فشل" : "Failed", color: "bg-red-500" },
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch recent orders with service info
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          quantity,
          status,
          created_at,
          service:services(name, name_ar)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      // Fetch order stats
      const { data: allOrders, error: statsError } = await supabase
        .from("orders")
        .select("status")
        .eq("user_id", user?.id);

      if (statsError) throw statsError;

      const total = allOrders?.length || 0;
      const completed = allOrders?.filter(o => o.status === "completed").length || 0;
      const inProgress = allOrders?.filter(o => 
        ["pending", "processing", "in_progress"].includes(o.status || "")
      ).length || 0;

      setRecentOrders(ordersData || []);
      setStats({ total, completed, inProgress });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || (isArabic ? "المستخدم" : "User");
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const statsData = [
    {
      title: isArabic ? "الرصيد الحالي" : "Current Balance",
      value: format(profile?.balance || 0),
      icon: Wallet,
      trend: isArabic ? "رصيدك المتاح للشراء" : "Available for purchases",
      trendUp: (profile?.balance || 0) > 0,
    },
    {
      title: isArabic ? "إجمالي الطلبات" : "Total Orders",
      value: stats.total.toString(),
      icon: ShoppingBag,
      trend: stats.total > 0 
        ? (isArabic ? `${stats.total} طلب حتى الآن` : `${stats.total} orders so far`)
        : (isArabic ? "ابدأ طلبك الأول" : "Start your first order"),
      trendUp: stats.total > 0,
    },
    {
      title: isArabic ? "طلبات مكتملة" : "Completed Orders",
      value: stats.completed.toString(),
      icon: CheckCircle,
      trend: `${completionRate}% ${isArabic ? 'نسبة الإكمال' : 'completion rate'}`,
      trendUp: completionRate > 50,
    },
    {
      title: isArabic ? "طلبات قيد التنفيذ" : "In Progress",
      value: stats.inProgress.toString(),
      icon: Clock,
      trend: stats.inProgress > 0 
        ? (isArabic ? `${stats.inProgress} طلب نشط` : `${stats.inProgress} active orders`)
        : (isArabic ? "لا توجد طلبات نشطة" : "No active orders"),
      trendUp: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ArrowIcon = isArabic ? ArrowUpLeft : ArrowUpRight;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isArabic ? `مرحباً، ${firstName}! 👋` : `Hello, ${firstName}! 👋`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isArabic ? 'إليك ملخص نشاطك في FasterFollow' : 'Here is your FasterFollow activity summary'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onNavigate?.("balance")}>
            <Plus className="h-4 w-4" />
            {t('addBalance')}
          </Button>
          <Button variant="default" onClick={() => onNavigate?.("new-order")}>
            <Zap className="h-4 w-4" />
            {t('newOrder')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <Card key={stat.title} variant="elevated">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{stat.value}</p>
                  <p className={`text-xs mt-2 flex items-center gap-1 ${
                    stat.trendUp ? "text-green-600" : "text-muted-foreground"
                  }`}>
                    {stat.trendUp && <TrendingUp className="h-3 w-3" />}
                    {stat.trend}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isArabic ? 'آخر الطلبات' : 'Recent Orders'}</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => onNavigate?.("orders")}>
            {isArabic ? 'عرض الكل' : 'View All'}
            <ArrowIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const statusInfo = statusLabels[order.status || "pending"];
                const serviceName = isArabic 
                  ? (order.service?.name_ar || order.service?.name)
                  : (order.service?.name || order.service?.name_ar);
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm md:text-base">
                          {serviceName || (isArabic ? "خدمة محذوفة" : "Deleted service")}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          <span className="text-primary font-medium">#{order.order_number}</span> • {order.quantity.toLocaleString()} {isArabic ? 'وحدة' : 'units'}
                        </p>
                      </div>
                    </div>
                    <div className={isArabic ? "text-left" : "text-right"}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusInfo.color}`} />
                        <span className="text-xs md:text-sm font-medium">{statusInfo.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(order.created_at), { 
                          addSuffix: true, 
                          locale: isArabic ? ar : enUS 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isArabic ? 'لا توجد طلبات بعد' : 'No orders yet'}
              </p>
              <Button variant="default" className="mt-4" onClick={() => onNavigate?.("new-order")}>
                <Zap className="h-4 w-4" />
                {isArabic ? 'ابدأ طلبك الأول' : 'Start your first order'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
