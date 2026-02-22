"use client";

import { useState } from 'react';
import { useRouter, usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Server,
  CreditCard,
  FileText,
  BookOpen,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  Bell,
  Megaphone,
  Ticket,
  Globe,
  Palette,
  Database,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path?: string;
  badge?: number;
  children?: { label: string; path: string }[];
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({
  icon: Icon,
  label,
  path,
  badge,
  children,
  isActive,
  onClick,
}: SidebarItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (children) {
      setIsOpen(!isOpen);
    } else if (path) {
      router.push(path);
    } else if (onClick) {
      onClick();
    }
  };

  const isCurrentPath = path === pathname;
  const hasActiveChild = children?.some((child) => child.path === pathname);

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          'hover:bg-primary/10 hover:text-primary',
          (isCurrentPath || hasActiveChild || isActive)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground'
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="flex-1 text-start">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {children && (
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </button>

      {children && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="pr-4 mt-1 space-y-1">
            {children.map((child) => (
              <button
                key={child.path}
                onClick={() => router.push(child.path)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  'hover:bg-primary/5 hover:text-primary',
                  pathname === child.path
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {child.label}
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ isOpen, onToggle }: AdminSidebarProps) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const menuItems: SidebarItemProps[] = [
    { icon: LayoutDashboard, label: 'نظرة عامة', path: '/admin' },
    {
      icon: Users,
      label: 'المستخدمين',
      children: [
        { label: 'جميع المستخدمين', path: '/admin/users' },
        { label: 'الموزعين', path: '/admin/users/resellers' },
        { label: 'الأدوار والصلاحيات', path: '/admin/users/roles' },
        { label: 'سجل النشاط', path: '/admin/users/activity' },
      ],
    },
    {
      icon: ShoppingCart,
      label: 'الطلبات',
      badge: 5,
      children: [
        { label: 'جميع الطلبات', path: '/admin/orders' },
        { label: 'طلبات معلقة', path: '/admin/orders/pending' },
        { label: 'قيد التنفيذ', path: '/admin/orders/processing' },
        { label: 'المكتملة', path: '/admin/orders/completed' },
      ],
    },
    { icon: Ticket, label: 'التذاكر', path: '/admin/tickets' },
    { icon: Star, label: 'التقييمات', path: '/admin/reviews' },
    {
      icon: Package,
      label: 'الخدمات',
      children: [
        { label: 'جميع الخدمات', path: '/admin/services' },
        { label: 'الأقسام', path: '/admin/categories' },
        { label: 'المؤرشفة', path: '/admin/services/archived' },
        { label: 'استيراد الخدمات', path: '/admin/services/import' },
      ],
    },
    {
      icon: Server,
      label: 'المزودين و API',
      children: [
        { label: 'المزودين', path: '/admin/providers' },
        { label: 'سجلات API', path: '/admin/providers/logs' },
      ],
    },
    {
      icon: CreditCard,
      label: 'المدفوعات',
      children: [
        { label: 'المعاملات', path: '/admin/payments' },
        { label: 'بوابات الدفع', path: '/admin/payments/gateways' },
        { label: 'الكوبونات', path: '/admin/payments/coupons' },
        { label: 'الفواتير', path: '/admin/payments/invoices' },
      ],
    },
    {
      icon: FileText,
      label: 'المحتوى',
      children: [
        { label: 'الصفحات', path: '/admin/content/pages' },
        { label: 'الصفحة الرئيسية', path: '/admin/content/homepage' },
        { label: 'القوائم', path: '/admin/content/menus' },
        { label: 'المؤرشفة', path: '/admin/content/archived' },
      ],
    },
    {
      icon: BookOpen,
      label: 'المدونة',
      children: [
        { label: 'المقالات', path: '/admin/blog/posts' },
        { label: 'الفئات', path: '/admin/blog/categories' },
        { label: 'المؤرشفة', path: '/admin/blog/archived' },
      ],
    },
    {
      icon: Megaphone,
      label: 'التسويق',
      children: [
        { label: 'الإعلانات', path: '/admin/marketing/announcements' },
        { label: 'النوافذ المنبثقة', path: '/admin/marketing/popups' },
        { label: 'برنامج الإحالة', path: '/admin/marketing/referral' },
      ],
    },
    {
      icon: BarChart3,
      label: 'التقارير',
      children: [
        { label: 'تقارير المبيعات', path: '/admin/reports/sales' },
        { label: 'تقارير SEO', path: '/admin/reports/seo' },
        { label: 'تحليلات', path: '/admin/reports/analytics' },
      ],
    },
    {
      icon: Settings,
      label: 'الإعدادات',
      children: [
        { label: 'إعدادات عامة', path: '/admin/settings/general' },
        { label: 'المظهر', path: '/admin/settings/appearance' },
        { label: 'SEO', path: '/admin/settings/seo' },
        { label: 'الأمان', path: '/admin/settings/security' },
        { label: 'النسخ الاحتياطي', path: '/admin/settings/backup' },
      ],
    },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-72 bg-card border-l border-border',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-0',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">SMM Panel</h1>
                <p className="text-xs text-muted-foreground">لوحة الإدارة</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onToggle}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-3">
            <nav className="space-y-1">
              {menuItems.map((item, index) => (
                <SidebarItem key={index} {...item} />
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 ml-3" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
