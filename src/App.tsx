import { Suspense, lazy, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "next-themes";

// Lazy load non-critical UI components to improve TTI
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));

// Lazy load auth and context providers - they can hydrate after initial paint
const AuthProvider = lazy(() => import("@/contexts/AuthContext").then(m => ({ default: m.AuthProvider })));
const CustomerLanguageProvider = lazy(() => import("@/contexts/CustomerLanguageContext").then(m => ({ default: m.CustomerLanguageProvider })));
const ThemeInitializer = lazy(() => import("@/components/ThemeInitializer"));
const ProtectedRoute = lazy(() => import("@/components/ProtectedRoute"));
const AdminProtectedRoute = lazy(() => import("@/components/admin/AdminProtectedRoute"));

// Critical path - load immediately
import Index from "./pages/Index";

// Lazy load non-critical routes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminProviders = lazy(() => import("./pages/admin/AdminProviders"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PageView = lazy(() => import("./pages/Page"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - reduce refetching
      gcTime: 1000 * 60 * 10, // 10 minutes cache
    },
  },
});

// Minimal loading fallback - inline styles for immediate rendering
const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background, #000)' }}>
    <div style={{ width: 32, height: 32, border: '4px solid var(--primary, #6366f1)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Deferred toasters component - loads after main content
const DeferredToasters = () => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Delay loading toasters until after main content is interactive
    // Use requestIdleCallback if available, otherwise setTimeout
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Suspense fallback={<PageLoader />}>
        <CustomerLanguageProvider>
          <TooltipProvider>
            <DeferredToasters />
            <BrowserRouter>
              <AuthProvider>
                <ThemeInitializer>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/services/:slug" element={<ServiceDetail />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/page/:slug" element={<PageView />} />
                    <Route path="/sitemap.xml" element={<Sitemap />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin/login" element={<AdminAuth />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout />
                        </AdminProtectedRoute>
                      }
                    >
                      <Route index element={<AdminOverview />} />
                      <Route path="profile" element={<AdminProfile />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="users/*" element={<AdminUsers />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="orders/*" element={<AdminOrders />} />
                      <Route path="tickets" element={<AdminTickets />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="services" element={<AdminServices />} />
                      <Route path="services/*" element={<AdminServices />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="providers" element={<AdminProviders />} />
                      <Route path="providers/*" element={<AdminProviders />} />
                      <Route path="payments" element={<AdminPayments />} />
                      <Route path="payments/coupons" element={<AdminCoupons />} />
                      <Route path="payments/*" element={<AdminPayments />} />
                      <Route path="content/*" element={<AdminContent />} />
                      <Route path="blog/*" element={<AdminBlog />} />
                      <Route path="marketing/*" element={<AdminMarketing />} />
                      <Route path="reports/*" element={<AdminReports />} />
                      <Route path="settings/*" element={<AdminSettings />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ThemeInitializer>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </CustomerLanguageProvider>
    </Suspense>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
