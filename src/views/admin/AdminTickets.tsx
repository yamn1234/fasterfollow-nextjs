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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "pending" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const AdminTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchTickets();

    // Subscribe to new tickets
    const channel = supabase
      .channel("admin_tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchReplies(selectedTicket.id);

      const channel = supabase
        .channel(`admin_ticket_replies_${selectedTicket.id}`)
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

  const handleSendReply = async () => {
    if (!newReply.trim() || !selectedTicket) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: newReply,
        is_admin: true,
      });

      if (error) throw error;

      // Update ticket status to pending if it was open
      if (selectedTicket.status === "open") {
        await supabase
          .from("tickets")
          .update({ status: "pending" })
          .eq("id", selectedTicket.id);
        
        setSelectedTicket({ ...selectedTicket, status: "pending" });
      }

      setNewReply("");
      toast.success("تم إرسال الرد بنجاح");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("فشل في إرسال الرد");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("تم تحديث الحالة بنجاح");
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: status as Ticket["status"] });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("فشل في تحديث الحالة");
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    closed: tickets.filter((t) => t.status === "closed").length,
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
      <div>
        <h1 className="text-2xl font-bold">إدارة التذاكر</h1>
        <p className="text-muted-foreground">عرض وإدارة تذاكر الدعم الفني</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي التذاكر</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-muted-foreground">مفتوحة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.closed}</p>
                <p className="text-sm text-muted-foreground">مغلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في التذاكر..."
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="open">مفتوحة</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="closed">مغلقة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموضوع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الأولوية</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا توجد تذاكر
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(ticket.created_at), "dd MMM yyyy", { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => {
                          handleUpdateStatus(ticket.id, value);
                        }}
                      >
                        <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">مفتوحة</SelectItem>
                          <SelectItem value="pending">قيد الانتظار</SelectItem>
                          <SelectItem value="closed">مغلقة</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selectedTicket && getStatusBadge(selectedTicket.status)}
              {selectedTicket && getPriorityBadge(selectedTicket.priority)}
            </div>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              ID المستخدم: {selectedTicket?.user_id}
            </p>
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
                      {reply.is_admin ? "فريق الدعم" : "العميل"}
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
          <div className="flex gap-2 pt-4 border-t">
            <Textarea
              placeholder="اكتب ردك..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              className="min-h-[60px]"
            />
            <Button onClick={handleSendReply} disabled={submitting || !newReply.trim()}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTickets;
