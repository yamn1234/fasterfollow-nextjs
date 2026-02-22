"use client";

import { useState } from 'react';
import { useRouter } from "next/navigation";

import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  Globe,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from 'next-themes';

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

const AdminHeader = ({ onMenuToggle }: AdminHeaderProps) => {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, title: 'طلب جديد #1234', message: 'تم إنشاء طلب جديد', time: 'منذ 5 دقائق', unread: true },
    { id: 2, title: 'مستخدم جديد', message: 'انضم مستخدم جديد للمنصة', time: 'منذ ساعة', unread: true },
    { id: 3, title: 'تنبيه رصيد منخفض', message: 'رصيد API المزود منخفض', time: 'منذ 3 ساعات', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  return (
    <header className="h-16 bg-card border-b border-border px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="hidden md:flex relative w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن طلبات، مستخدمين، خدمات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-secondary/50"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Globe className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('ar')}>
              <span className={language === 'ar' ? 'font-bold' : ''}>العربية</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('en')}>
              <span className={language === 'en' ? 'font-bold' : ''}>English</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>الإشعارات</span>
              <Button variant="ghost" size="sm" className="text-xs h-6">
                تحديد الكل كمقروء
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
                <div className="flex items-center gap-2 w-full">
                  <span className={`font-medium ${notification.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </span>
                  {notification.unread && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{notification.message}</span>
                <span className="text-xs text-muted-foreground mt-1">{notification.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-primary">
              عرض جميع الإشعارات
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10 px-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{profile?.full_name || 'مدير'}</span>
                <span className="text-xs text-muted-foreground">مدير النظام</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
              <User className="w-4 h-4 ml-2" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin/settings/general')}>
              <Settings className="w-4 h-4 ml-2" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminHeader;
