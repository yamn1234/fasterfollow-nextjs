"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerLanguageProvider } from "@/contexts/CustomerLanguageContext";
import ThemeInitializer from "@/components/ThemeInitializer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

const DeferredToasters = () => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const hasIdleCallback = typeof window !== 'undefined' && 'requestIdleCallback' in window;
    
    if (hasIdleCallback) {
      const id = window.requestIdleCallback(() => setShow(true));
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(id);
    }
  }, []);
  
  if (!show) return null;
  
  return (
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
    </Suspense>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <CustomerLanguageProvider>
          <TooltipProvider>
            <DeferredToasters />
            <AuthProvider>
              <ThemeInitializer>
                {children}
              </ThemeInitializer>
            </AuthProvider>
          </TooltipProvider>
        </CustomerLanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}