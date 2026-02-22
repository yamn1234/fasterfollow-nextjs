"use client";

import { Suspense } from "react";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/layouts/AdminLayout";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <AdminProtectedRoute>
                <AdminLayout>
                    {children}
                </AdminLayout>
            </AdminProtectedRoute>
        </Suspense>
    );
}
