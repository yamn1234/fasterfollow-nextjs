"use client";
import Redirect from "@/components/Redirect";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from "next/navigation";

import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2, Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
}

const AdminProtectedRoute = ({ children, requiredPermission }: AdminProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading, hasPermission } = useAdminAuth();
  const pathname = usePathname();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center animate-pulse">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري التحقق من الصلاحيات...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/admin/login" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
          <p className="text-muted-foreground">ليس لديك صلاحيات الوصول لهذه الصفحة</p>
          <a href="/" className="inline-block text-primary hover:underline">
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">صلاحية مطلوبة</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية المطلوبة للوصول لهذه الصفحة</p>
          <a href="/admin" className="inline-block text-primary hover:underline">
            العودة للوحة التحكم
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
