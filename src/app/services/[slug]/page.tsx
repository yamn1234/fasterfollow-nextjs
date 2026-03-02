import { Suspense } from "react";
import { Metadata } from "next";
import { supabase } from "@/integrations/supabase/client";
import ServiceDetail from "@/views/ServiceDetail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const decodedSlug = decodeURIComponent(rawSlug);
  const { data: service } = await supabase
    .from('services')
    .select('name_ar, name, description_ar, description, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, image_url, is_indexable, canonical_url, slug')
    .or(`slug.eq.${decodedSlug},slug.eq.${rawSlug}`)
    .single();

  if (!service) {
    return {
      title: "خدمة غير موجودة | فاستر فولو",
    };
  }

  const title = service.seo_title || service.name_ar || service.name || "خدمة وسائل تواصل";
  const desc = service.seo_description || service.description_ar || service.description || "أفضل خدمات منصات التواصل الاجتماعي بأرخص الأسعار مع فاستر فولو.";
  const image = service.og_image || service.image_url;

  return {
    title: `${title} | فاستر فولو`,
    description: desc,
    keywords: service.seo_keywords ? service.seo_keywords : undefined,
    robots: service.is_indexable === false ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical: service.canonical_url || `https://fasterfollow.net/services/${rawSlug}`,
    },
    openGraph: {
      title: service.og_title || title,
      description: service.og_description || desc,
      images: image ? [image] : [],
      url: `https://fasterfollow.net/services/${rawSlug}`,
      type: "article",
    },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <ServiceDetail />
    </Suspense>
  );
}
