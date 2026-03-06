import { Suspense } from "react";
import { Metadata } from "next";
import { supabase } from "@/integrations/supabase/client";
import DynamicContentView from "@/views/DynamicContentView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const decodedSlug = decodeURIComponent(rawSlug);

  // 1. Try to find a page
  const { data: page } = await supabase
    .from('pages')
    .select('title, title_ar, seo_title, seo_description, seo_keywords, og_title, og_description, og_image, is_indexable, canonical_url')
    .or(`slug.eq.${decodedSlug},slug.eq.${rawSlug}`)
    .single();

  if (page) {
    const title = page.seo_title || page.title_ar || page.title;
    return {
      title: `${title} | فاستر فولو`,
      description: page.seo_description || '',
      keywords: page.seo_keywords || undefined,
      robots: page.is_indexable === false ? { index: false, follow: false } : { index: true, follow: true },
      alternates: {
        canonical: page.canonical_url || `https://fasterfollow.net/${rawSlug}`,
      },
      openGraph: {
        title: page.og_title || title,
        description: page.og_description || page.seo_description || '',
        images: page.og_image ? [page.og_image] : [],
        url: `https://fasterfollow.net/${rawSlug}`,
      },
    };
  }

  // 2. Try to find a blog post
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, title_ar, excerpt, seo_title, seo_description, seo_keywords, featured_image, og_title, og_description, og_image, is_indexable, canonical_url')
    .or(`slug.eq.${decodedSlug},slug.eq.${rawSlug}`)
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
        canonical: post.canonical_url || `https://fasterfollow.net/${rawSlug}`,
      },
      openGraph: {
        title: post.og_title || title,
        description: post.og_description || desc,
        images: image ? [image] : [],
        url: `https://fasterfollow.net/${rawSlug}`,
        type: "article",
      },
    };
  }

  return {
    title: "صفحة غير موجودة | فاستر فولو",
  };
}

export default async function DynamicPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const decodedSlug = decodeURIComponent(rawSlug);

  // 1. Try to find a page
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .or(`slug.eq.${decodedSlug},slug.eq.${rawSlug}`)
    .maybeSingle();

  // 2. Try to find a blog post if not a page
  let post = null;
  if (!page) {
    const { data: blogPost } = await supabase
      .from('blog_posts')
      .select('*')
      .or(`slug.eq.${decodedSlug},slug.eq.${rawSlug}`)
      .maybeSingle();
    post = blogPost;
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <DynamicContentView initialData={page || post} initialType={page ? 'page' : (post ? 'blog' : null)} />
    </Suspense>
  );
}
