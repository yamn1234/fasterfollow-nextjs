import { 
  LayoutDashboard, 
  ShoppingBag, 
  Zap,
  Wallet,
  MoreHorizontal,
  Receipt,
  MessageSquare,
  Ticket,
  User,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TabType } from "@/pages/Dashboard";
import { useTranslation } from "@/hooks/useTranslation";

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const MobileBottomNav = ({ activeTab, setActiveTab }: MobileBottomNavProps) => {
  const { t, isArabic } = useTranslation();

  const mainItems = [
    { id: "overview" as TabType, title: t('home'), icon: LayoutDashboard },
    { id: "new-order" as TabType, title: t('newOrder'), icon: Zap },
    { id: "orders" as TabType, title: t('myOrders'), icon: ShoppingBag },
    { id: "balance" as TabType, title: isArabic ? 'الرصيد' : 'Balance', icon: Wallet },
  ];

  const moreItems = [
    { id: "transactions" as TabType, title: t('transactions'), icon: Receipt },
    { id: "coupon" as TabType, title: t('coupon'), icon: Ticket },
    { id: "support" as TabType, title: t('support'), icon: MessageSquare },
    { id: "profile" as TabType, title: t('profile'), icon: User },
    { id: "settings" as TabType, title: t('settings'), icon: Settings },
  ];

  const isMoreActive = moreItems.some(item => item.id === activeTab);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around py-2 px-1">
        {mainItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 h-auto py-2 px-3 rounded-xl transition-all ${
              activeTab === item.id
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className={`h-5 w-5 ${activeTab === item.id ? "text-primary" : ""}`} />
            <span className="text-[10px] font-medium">{item.title}</span>
          </Button>
        ))}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-0.5 h-auto py-2 px-3 rounded-xl transition-all ${
                isMoreActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MoreHorizontal className={`h-5 w-5 ${isMoreActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{isArabic ? 'المزيد' : 'More'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 cursor-pointer ${
                  activeTab === item.id ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default MobileBottomNav;
