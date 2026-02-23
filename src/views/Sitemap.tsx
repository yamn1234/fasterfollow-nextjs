"use client";
import { useEffect } from 'react';

const Sitemap = () => {
  useEffect(() => {
    // Redirect directly to the Edge Function for proper XML content-type
    const baseUrl = 'https://fasterfollow.net';
    const sitemapUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sitemap?baseUrl=${encodeURIComponent(baseUrl)}`;

    // Use replace to avoid adding to browser history
    window.location.replace(sitemapUrl);
  }, []);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">جاري تحميل خريطة الموقع...</p>
      </div>
    </div>
  );
};

export default Sitemap;
