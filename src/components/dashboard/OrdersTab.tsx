import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Eye, Loader2, ShoppingBag, ExternalLink, Star } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface Order {
  id: string;
  order_number: number;
  link: string;
  quantity: number;
  price: number;
  status: string;
  start_count: number | null;
  remains: number | null;
  created_at: string;
  completed_at: string | null;
  service: {
    name: string;
    name_ar: string | null;
  } | null;
}

const getStatusConfig = (isArabic: boolean): Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> => ({
  pending: { label: isArabic ? "في الانتظار" : "Pending", variant: "outline" },
  processing: { label: isArabic ? "قيد المعالجة" : "Processing", variant: "secondary" },
  in_progress: { label: isArabic ? "قيد التنفيذ" : "In Progress", variant: "secondary" },
  completed: { label: isArabic ? "مكتمل" : "Completed", variant: "default" },
  partial: { label: isArabic ? "جزئي" : "Partial", variant: "outline" },
  cancelled: { label: isArabic ? "ملغي" : "Cancelled", variant: "destructive" },
  refunded: { label: isArabic ? "مسترد" : "Refunded", variant: "outline" },
  failed: { label: isArabic ? "فشل" : "Failed", variant: "destructive" },
});

const OrdersTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, isArabic } = useTranslation();
  const statusConfig = getStatusConfig(isArabic);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  const submitReview = async () => {
    if (!selectedOrder || !user) return;
    setSubmittingReview(true);
    try {
      const { data: service } = await supabase
        .from('orders')
        .select('service_id')
        .eq('id', selectedOrder.id)
        .single();
      
      if (!service) throw new Error('Order not found');

      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        service_id: service.service_id,
        order_id: selectedOrder.id,
        rating: reviewRating,
        comment: reviewComment || null,
      });

      if (error) throw error;

      toast({ 
        title: isArabic ? 'شكراً لك!' : 'Thank you!', 
        description: isArabic ? 'تم إرسال تقييمك وسيتم مراجعته' : 'Your review has been submitted' 
      });
      setReviewedOrders(prev => new Set(prev).add(selectedOrder.id));
      setShowReviewDialog(false);
      setReviewComment("");
      setReviewRating(5);
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Auto-sync orders every 30 seconds
      const syncInterval = setInterval(async () => {
        console.log('Auto-syncing orders...');
        try {
          // Check and update order statuses from provider
          const pendingOrders = orders.filter(o => 
            o.status === 'pending' || o.status === 'processing' || o.status === 'in_progress'
          );
          
          for (const order of pendingOrders) {
            try {
              await supabase.functions.invoke('smm-check-order-status', {
                body: { orderId: order.id },
              });
            } catch (e) {
              console.log('Status check failed for order:', order.id);
            }
          }
          
          // Refetch orders to get updated statuses
          fetchOrders();
        } catch (error) {
          console.error('Auto-sync error:', error);
        }
      }, 30000); // 30 seconds

      return () => clearInterval(syncInterval);
    }
  }, [user, orders.length]);

  // Realtime subscription for order updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Order update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Fetch the new order with service info
            const { data } = await supabase
              .from("orders")
              .select(`
                id, order_number, link, quantity, price, status, start_count, remains,
                created_at, completed_at, service:services(name, name_ar)
              `)
              .eq("id", payload.new.id)
              .single();
            
            if (data) {
              setOrders(prev => [data as Order, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(order => {
              if (order.id === payload.new.id) {
                return {
                  ...order,
                  status: payload.new.status,
                  start_count: payload.new.start_count,
                  remains: payload.new.remains,
                  completed_at: payload.new.completed_at,
                  error_message: payload.new.error_message
                };
              }
              return order;
            }));
            
            // Update selected order if viewing details
            if (selectedOrder?.id === payload.new.id) {
              setSelectedOrder(prev => prev ? {
                ...prev,
                status: payload.new.status,
                start_count: payload.new.start_count,
                remains: payload.new.remains,
                completed_at: payload.new.completed_at
              } : null);
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedOrder?.id]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          link,
          quantity,
          price,
          status,
          start_count,
          remains,
          created_at,
          completed_at,
          service:services(name, name_ar)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const orderNum = order.order_number?.toString() || '';
    const matchesSearch =
      orderNum.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.service?.name_ar || order.service?.name || "").includes(searchQuery) ||
      order.link.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProgress = (order: Order) => {
    if (order.status === "completed") return 100;
    if (order.remains === null || order.start_count === null) return 0;
    const delivered = order.quantity - order.remains;
    return Math.min(Math.round((delivered / order.quantity) * 100), 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t('myOrders')}</h1>
        <p className="text-muted-foreground mt-1">
          {isArabic ? 'تتبع جميع طلباتك وحالتها' : 'Track all your orders and their status'}
        </p>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>{isArabic ? 'سجل الطلبات' : 'Order History'} ({orders.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isArabic ? "بحث برقم الطلب أو الخدمة..." : "Search by order ID or service..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder={isArabic ? "الحالة" : "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isArabic ? "جميع الحالات" : "All Statuses"}</SelectItem>
                  <SelectItem value="pending">{statusConfig.pending.label}</SelectItem>
                  <SelectItem value="processing">{statusConfig.processing.label}</SelectItem>
                  <SelectItem value="in_progress">{statusConfig.in_progress.label}</SelectItem>
                  <SelectItem value="completed">{statusConfig.completed.label}</SelectItem>
                  <SelectItem value="partial">{statusConfig.partial.label}</SelectItem>
                  <SelectItem value="cancelled">{statusConfig.cancelled.label}</SelectItem>
                  <SelectItem value="failed">{statusConfig.failed.label}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const progress = getProgress(order);
              const config = statusConfig[order.status || "pending"];
              return (
                <div 
                  key={order.id} 
                  className="p-4 rounded-lg bg-secondary/50 space-y-3"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {isArabic ? (order.service?.name_ar || order.service?.name) : (order.service?.name || order.service?.name_ar) || (isArabic ? "خدمة محذوفة" : "Deleted service")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        #{order.order_number}
                      </p>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isArabic ? 'الكمية' : 'Qty'}: {order.quantity.toLocaleString()}</span>
                    <span className="font-medium">${order.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs">{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>{isArabic ? 'رقم الطلب' : 'Order ID'}</TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>{isArabic ? 'الخدمة' : 'Service'}</TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>{isArabic ? 'الكمية' : 'Quantity'}</TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>{isArabic ? 'السعر' : 'Price'}</TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>{isArabic ? 'التقدم' : 'Progress'}</TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>{isArabic ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className={isArabic ? "text-right" : "text-left"}>{isArabic ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const progress = getProgress(order);
                  const config = statusConfig[order.status || "pending"];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-bold text-primary">#{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {isArabic ? (order.service?.name_ar || order.service?.name) : (order.service?.name || order.service?.name_ar) || (isArabic ? "خدمة محذوفة" : "Deleted service")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {order.link}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{order.quantity.toLocaleString()}</TableCell>
                      <TableCell>${order.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: isArabic ? ar : enUS })}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title={isArabic ? "عرض التفاصيل" : "View Details"}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {orders.length === 0 ? (isArabic ? "لا توجد طلبات بعد" : "No orders yet") : (isArabic ? "لا توجد طلبات مطابقة للبحث" : "No orders match your search")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'تفاصيل الطلب' : 'Order Details'}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{isArabic ? 'رقم الطلب' : 'Order ID'}</p>
                  <p className="font-bold text-primary text-lg">#{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isArabic ? 'الحالة' : 'Status'}</p>
                  <Badge variant={statusConfig[selectedOrder.status || "pending"].variant}>
                    {statusConfig[selectedOrder.status || "pending"].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isArabic ? 'الكمية' : 'Quantity'}</p>
                  <p className="font-medium">{selectedOrder.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isArabic ? 'السعر' : 'Price'}</p>
                  <p className="font-medium">${selectedOrder.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isArabic ? 'البداية' : 'Start Count'}</p>
                  <p className="font-medium">{selectedOrder.start_count?.toLocaleString() || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المتبقي</p>
                  <p className="font-medium">{selectedOrder.remains?.toLocaleString() || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الخدمة</p>
                <p className="font-medium">
                  {selectedOrder.service?.name_ar || selectedOrder.service?.name || "خدمة محذوفة"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الرابط</p>
                <a 
                  href={selectedOrder.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  {selectedOrder.link.length > 40 
                    ? selectedOrder.link.slice(0, 40) + "..." 
                    : selectedOrder.link}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                <p className="font-medium">
                  {format(new Date(selectedOrder.created_at), "yyyy/MM/dd - HH:mm", { locale: ar })}
                </p>
              </div>
               {selectedOrder.completed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الإكمال</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.completed_at), "yyyy/MM/dd - HH:mm", { locale: ar })}
                  </p>
                </div>
              )}
              {selectedOrder.status === 'completed' && !reviewedOrders.has(selectedOrder.id) && (
                <Button className="w-full mt-4" onClick={() => setShowReviewDialog(true)}>
                  <Star className="w-4 h-4 ml-2" />
                  قيّم هذه الخدمة
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تقييم الخدمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)}>
                  <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="اكتب تعليقك (اختياري)..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>إلغاء</Button>
            <Button onClick={submitReview} disabled={submittingReview}>
              {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال التقييم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersTab;
