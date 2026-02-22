"use client";
import { Suspense } from "react";
import AdminSettings from "@/views/admin/AdminSettings";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <AdminSettings />
    </Suspense>
  );
}
