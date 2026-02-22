"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowRight, Calendar, Eye, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import JsonLd from '@/components/JsonLd';

interface BlogPost {
  id: string;
  title: string;
  title_ar: string | null;
  slug: string;
  content: string | null;
  excerpt: string | null;
  excerpt_ar: string | null;
  featured_image: string | null;
  published_at: string | null;
  updated_at: string | null;
  views_count: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .eq('is_archived', false)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setPost(data);

      // Increment views
      await supabase
        .from('blog_posts')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', data.id);

      // Fetch category
      if (data.category_id) {
        const { data: catData } = await supabase
          .from('blog_categories')
          .select('id, name, name_ar')
          .eq('id', data.category_id)
          .single();
        setCategory(catData);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead
          title="المقال غير موجود"
          description="المقال الذي تبحث عنه غير متوفر"
          noIndex
        />
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">المقال غير موجود</h1>
          <p className="text-muted-foreground mb-6">المقال الذي تبحث عنه غير متوفر</p>
          <Button asChild>
            <Link href="/blog">
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للمدونة
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const pageTitle = post.seo_title || post.title_ar || post.title;
  const pageDesc = post.seo_description || post.excerpt_ar || post.excerpt || '';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        keywords={post.seo_keywords || undefined}
        canonicalUrl={`/blog/${slug}`}
        ogImage={post.og_image || post.featured_image || undefined}
        ogType="article"
        articlePublishedTime={post.published_at || undefined}
        articleModifiedTime={post.updated_at || undefined}
        articleAuthor="فاستر فولو"
      />
      <JsonLd
        data={[
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'الرئيسية', url: '/' },
              { name: 'المدونة', url: '/blog' },
              { name: pageTitle, url: `/blog/${slug}` },
            ],
          },
        ]}
      />
      <Header />

      <main className="container py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/blog">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمدونة
          </Link>
        </Button>

        <article>
          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title_ar || post.title}
              className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
            />
          )}

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {post.title_ar || post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(post.published_at), 'dd MMMM yyyy', { locale: ar })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views_count} مشاهدة
              </span>
              {category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {category.name_ar || category.name}
                </Badge>
              )}
            </div>
          </header>

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
