import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  ShoppingBag, 
  Gift,
  RotateCcw,
  Loader2,
  Receipt
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

type TransactionType = "deposit" | "purchase" | "bonus" | "refund" | "manual" | "referral";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  balance_before: number;
  balance_after: number;
  payment_method: string | null;
  payment_reference: string | null;
  created_at: string;
}

const typeConfig: Record<TransactionType, { 
  label: string; 
  icon: typeof ArrowUpRight; 
  colorClass: string;
  bgClass: string;
}> = {
  deposit: { 
    label: "إيداع", 
    icon: ArrowDownLeft, 
    colorClass: "text-green-600",
    bgClass: "bg-green-100 dark:bg-green-900/30",
  },
  purchase: { 
    label: "شراء", 
    icon: ShoppingBag, 
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  bonus: { 
    label: "مكافأة", 
    icon: Gift, 
    colorClass: "text-purple-600",
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
  },
  refund: { 
    label: "استرداد", 
    icon: RotateCcw, 
    colorClass: "text-blue-600",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
  },
  manual: { 
    label: "يدوي", 
    icon: Wallet, 
    colorClass: "text-orange-600",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
  },
  referral: { 
    label: "إحالة", 
    icon: Gift, 
    colorClass: "text-pink-600",
    bgClass: "bg-pink-100 dark:bg-pink-900/30",
  },
};

const TransactionsTab = () => {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.description || "").includes(searchQuery) ||
      (tx.payment_reference || "").includes(searchQuery);
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalDeposits = transactions
    .filter((tx) => tx.type === "deposit" || tx.type === "bonus" || tx.type === "refund" || tx.type === "referral")
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalPurchases = transactions
    .filter((tx) => tx.type === "purchase")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

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
        <h1 className="text-2xl md:text-3xl font-bold">سجل العمليات</h1>
        <p className="text-muted-foreground mt-1">
          جميع عمليات الشحن والشراء والاسترداد
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ArrowDownLeft className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الإيداعات</p>
              <p className="text-xl font-bold text-green-600">+${totalDeposits.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
              <p className="text-xl font-bold text-primary">-${totalPurchases.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
              <Wallet className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
              <p className="text-xl font-bold">${profile?.balance?.toFixed(2) || "0.00"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>جميع العمليات ({transactions.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pr-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="deposit">إيداع</SelectItem>
                  <SelectItem value="purchase">شراء</SelectItem>
                  <SelectItem value="bonus">مكافأة</SelectItem>
                  <SelectItem value="refund">استرداد</SelectItem>
                  <SelectItem value="manual">يدوي</SelectItem>
                  <SelectItem value="referral">إحالة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const config = typeConfig[tx.type];
                const Icon = config.icon;
                const isPositive = tx.amount >= 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`h-9 w-9 md:h-10 md:w-10 rounded-lg ${config.bgClass} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 md:h-5 md:w-5 ${config.colorClass}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm md:text-base">
                          {tx.description || config.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {tx.payment_method && (
                            <span className="text-xs text-muted-foreground">{tx.payment_method}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`font-bold ${isPositive ? "text-green-600" : ""}`}>
                        {isPositive ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {transactions.length === 0 ? "لا توجد عمليات بعد" : "لا توجد عمليات مطابقة للبحث"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsTab;
