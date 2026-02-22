"use client";
import { Suspense } from "react";
import AdminOrders from "@/views/admin/AdminOrders";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <AdminOrders />
    </Suspense>
  );
}
