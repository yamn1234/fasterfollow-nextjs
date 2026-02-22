const fs = require('fs');
const path = require('path');

const cwd = path.join(__dirname);
const appDir = path.join(cwd, 'src', 'app');

const map = {
    'Dashboard.tsx': 'dashboard/page.tsx',
    'Auth.tsx': 'auth/page.tsx',
    'Services.tsx': 'services/page.tsx',
    'ServiceDetail.tsx': 'services/[slug]/page.tsx',
    'Blog.tsx': 'blog/page.tsx',
    'BlogPost.tsx': 'blog/[slug]/page.tsx',
    'Page.tsx': 'page/[slug]/page.tsx',
    'AdminAuth.tsx': 'admin/login/page.tsx',
    'admin/AdminOverview.tsx': 'admin/page.tsx',
    'admin/AdminUsers.tsx': 'admin/users/page.tsx',
    'admin/AdminOrders.tsx': 'admin/orders/page.tsx',
    'admin/AdminServices.tsx': 'admin/services/page.tsx',
    'admin/AdminCategories.tsx': 'admin/categories/page.tsx',
    'admin/AdminProviders.tsx': 'admin/providers/page.tsx',
    'admin/AdminPayments.tsx': 'admin/payments/page.tsx',
    'admin/AdminCoupons.tsx': 'admin/payments/coupons/page.tsx',
    'admin/AdminContent.tsx': 'admin/content/page.tsx',
    'admin/AdminBlog.tsx': 'admin/blog/page.tsx',
    'admin/AdminMarketing.tsx': 'admin/marketing/page.tsx',
    'admin/AdminReports.tsx': 'admin/reports/page.tsx',
    'admin/AdminSettings.tsx': 'admin/settings/page.tsx',
    'admin/AdminProfile.tsx': 'admin/profile/page.tsx',
    'admin/AdminTickets.tsx': 'admin/tickets/page.tsx',
    'admin/AdminReviews.tsx': 'admin/reviews/page.tsx',
};

for (const [src, dest] of Object.entries(map)) {
    const destPath = path.join(appDir, dest);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    const importName = src.replace('.tsx', '').replace(/[^a-zA-Z0-9]/g, '');
    const importPath = `@/views/${src.replace('.tsx', '')}`;

    const content = `"use client";\nimport { Suspense } from "react";\nimport ${importName} from "${importPath}";\n\nexport default function Page() {\n  return (\n    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>\n      <${importName} />\n    </Suspense>\n  );\n}\n`;
    fs.writeFileSync(destPath, content);
    console.log('Created ' + destPath);
}

// Create layout and providers in src/app
const layoutContent = `import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cairo = Cairo({ subsets: ["latin", "arabic"], display: "swap" });

export const metadata: Metadata = {
  title: "FasterFollow",
  description: "FasterFollow Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning dir="rtl">
      <body className={cairo.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}`;

const providersContent = `"use client";

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
}`;

fs.writeFileSync(path.join(appDir, 'layout.tsx'), layoutContent);
fs.writeFileSync(path.join(appDir, 'providers.tsx'), providersContent);
fs.renameSync(path.join(cwd, 'app', 'globals.css'), path.join(appDir, 'globals.css')).catch(() => { });
