import { Suspense } from "react";
import { Metadata } from "next";
import { supabase } from "@/integrations/supabase/client";
import BlogPost from "@/views/BlogPost";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, seo_title, seo_description, seo_keywords, featured_image, og_image')
    .eq('slug', params.slug)
    .single();

  if (!post) {
    return {
      title: "مقال غير موجود | فاستر فولو",
    };
  }

  const title = post.seo_title || post.title || "مقال المدونة";
  const desc = post.seo_description || post.excerpt || "اقرأ أحدث المقالات والنصائح على فاستر فولو الحصرية.";
  const image = post.og_image || post.featured_image;

  return {
    title: `${title} | فاستر فولو`,
    description: desc,
    keywords: post.seo_keywords ? post.seo_keywords : undefined,
    openGraph: {
      title: title,
      description: desc,
      images: image ? [image] : [],
      url: `https://fasterfollow.site/blog/${params.slug}`,
      type: "article",
    },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <BlogPost />
    </Suspense>
  );
}
