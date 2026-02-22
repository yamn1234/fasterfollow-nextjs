import { useState } from 'react';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from 'next-themes';

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <div className="min-h-screen bg-secondary/30 flex">
          <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default AdminLayout;
