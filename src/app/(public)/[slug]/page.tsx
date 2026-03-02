import { Suspense } from "react";
import { Metadata } from "next";
import { supabase } from "@/integrations/supabase/client";
import DynamicContentView from "@/views/DynamicContentView";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug);

  // 1. Try to find a page
  const { data: page } = await supabase
    .from('pages')
    .select('title, title_ar, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, is_indexable, canonical_url')
    .or(`slug.eq.${decodedSlug},slug.eq.${params.slug}`)
    .single();

  if (page) {
    const title = page.seo_title || page.title_ar || page.title;
    return {
      title: `${title} | فاستر فولو`,
      description: page.seo_description || '',
      keywords: page.seo_keywords || undefined,
      robots: page.is_indexable === false ? { index: false, follow: false } : { index: true, follow: true },
      alternates: {
        canonical: page.canonical_url || `https://fasterfollow.net/${params.slug}`,
      },
      openGraph: {
        title: page.og_title || title,
        description: page.og_description || page.seo_description || '',
        images: page.og_image ? [page.og_image] : [],
        url: `https://fasterfollow.net/${params.slug}`,
      },
    };
  }

  // 2. Try to find a blog post
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, title_ar, excerpt, seo_title, seo_description, seo_keywords, featured_image, og_title, og_description, og_image, is_indexable, canonical_url')
    .or(`slug.eq.${decodedSlug},slug.eq.${params.slug}`)
    .single();

  if (post) {
    const title = post.seo_title || post.title_ar || post.title || "مقال المدونة";
    const desc = post.seo_description || post.excerpt || "اقرأ أحدث المقالات والنصائح على فاستر فولو الحصرية.";
    const image = post.og_image || post.featured_image;

    return {
      title: `${title} | فاستر فولو`,
      description: desc,
      keywords: post.seo_keywords || undefined,
      robots: post.is_indexable === false ? { index: false, follow: false } : { index: true, follow: true },
      alternates: {
        canonical: post.canonical_url || `https://fasterfollow.net/${params.slug}`,
      },
      openGraph: {
        title: post.og_title || title,
        description: post.og_description || desc,
        images: image ? [image] : [],
        url: `https://fasterfollow.net/${params.slug}`,
        type: "article",
      },
    };
  }

  return {
    title: "صفحة غير موجودة | فاستر فولو",
  };
}

export default function DynamicPageRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <DynamicContentView />
    </Suspense>
  );
}
