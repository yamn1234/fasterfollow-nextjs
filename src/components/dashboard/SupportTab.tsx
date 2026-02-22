import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: "open" | "pending" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

type RequestType = "speedup" | "refund" | "cancel" | "other";

const requestTypeLabels: Record<RequestType, string> = {
  speedup: "تسريع",
  refund: "تعويض",
  cancel: "إلغاء",
  other: "أخرى",
};

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const SupportTab = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New ticket form
  const [newOrderId, setNewOrderId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newRequestType, setNewRequestType] = useState<RequestType>("other");

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.id);

      // Subscribe to new replies
      const channel = supabase
        .channel(`ticket_replies_${selectedTicket.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ticket_replies",
            filter: `ticket_id=eq.${selectedTicket.id}`,
          },
          (payload) => {
            setReplies((prev) => [...prev, payload.new as TicketReply]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets((data as Ticket[]) || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("فشل في تحميل التذاكر");
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("ticket_replies")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newMessage.trim()) {
      toast.error("يرجى كتابة الرسالة");
      return;
    }

    setSubmitting(true);
    try {
      const subject = newOrderId.trim() 
        ? `طلب #${newOrderId} - ${requestTypeLabels[newRequestType]}`
        : requestTypeLabels[newRequestType];

      const { error } = await supabase.from("tickets").insert({
        user_id: user?.id,
        subject: subject,
        message: newMessage,
        priority: newRequestType === "speedup" ? "high" : "medium",
      });

      if (error) throw error;

      toast.success("تم إنشاء التذكرة بنجاح");
      setIsCreateDialogOpen(false);
      setNewOrderId("");
      setNewMessage("");
      setNewRequestType("other");
      fetchTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("فشل في إنشاء التذكرة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!newReply.trim() || !selectedTicket) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: newReply,
        is_admin: false,
      });

      if (error) throw error;

      setNewReply("");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("فشل في إرسال الرد");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="w-3 h-3 ml-1" />
            مفتوحة
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="w-3 h-3 ml-1" />
            قيد الانتظار
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="default" className="bg-muted text-muted-foreground">
            <AlertCircle className="w-3 h-3 ml-1" />
            مغلقة
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRequestTypeBadge = (subject: string) => {
    if (subject.includes("تسريع")) return <Badge variant="destructive">تسريع</Badge>;
    if (subject.includes("تعويض")) return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">تعويض</Badge>;
    if (subject.includes("إلغاء")) return <Badge variant="secondary">إلغاء</Badge>;
    return <Badge variant="outline">أخرى</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">عالية</Badge>;
      case "medium":
        return <Badge variant="secondary">متوسطة</Badge>;
      case "low":
        return <Badge variant="outline">منخفضة</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الدعم الفني</h1>
          <p className="text-muted-foreground">تواصل معنا لأي استفسار أو مشكلة</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          تذكرة جديدة
        </Button>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد تذاكر</h3>
            <p className="text-muted-foreground mb-4">
              لم تقم بإنشاء أي تذاكر دعم بعد
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء تذكرة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(ticket.status)}
                      {getRequestTypeBadge(ticket.subject)}
                    </div>
                    <h3 className="font-medium truncate">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {ticket.message}
                    </p>
                  </div>
                  <div className="text-left text-sm text-muted-foreground shrink-0">
                    {format(new Date(ticket.created_at), "dd MMM yyyy", { locale: ar })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء تذكرة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">نوع الطلب</label>
              <Select value={newRequestType} onValueChange={(v: RequestType) => setNewRequestType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speedup">تسريع</SelectItem>
                  <SelectItem value="refund">تعويض</SelectItem>
                  <SelectItem value="cancel">إلغاء</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">رقم الطلب (اختياري)</label>
              <Input
                placeholder="أدخل رقم الطلب"
                value={newOrderId}
                onChange={(e) => setNewOrderId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">الرسالة</label>
              <Textarea
                placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
                rows={5}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateTicket} disabled={submitting} className="w-full">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Plus className="w-4 h-4 ml-2" />
              )}
              إنشاء التذكرة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selectedTicket && getStatusBadge(selectedTicket.status)}
              {selectedTicket && getRequestTypeBadge(selectedTicket.subject)}
            </div>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4">
              {/* Original message */}
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm">{selectedTicket?.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedTicket && format(new Date(selectedTicket.created_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                </p>
              </div>

              {/* Replies */}
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-4 rounded-lg ${
                    reply.is_admin
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">
                      {reply.is_admin ? "فريق الدعم" : "أنت"}
                    </span>
                    {reply.is_admin && (
                      <Badge variant="secondary" className="text-xs">
                        إدارة
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{reply.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(reply.created_at), "dd MMM yyyy - HH:mm", { locale: ar })}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Reply input */}
          {selectedTicket?.status !== "closed" && (
            <div className="flex gap-2 pt-4 border-t">
              <Input
                placeholder="اكتب ردك..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
              />
              <Button onClick={handleSendReply} disabled={submitting || !newReply.trim()}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTab;
