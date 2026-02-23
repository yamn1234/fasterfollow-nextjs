"use client";
import { useState, useEffect } from 'react';
import Link from "next/link";

import { Search, Calendar, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  views_count: number;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, catsRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, title, title_ar, slug, excerpt, featured_image, published_at, views_count, category_id')
          .eq('status', 'published')
          .eq('is_archived', false)
          .order('published_at', { ascending: false }),
        supabase
          .from('blog_categories')
          .select('id, name, name_ar')
          .eq('is_active', true),
      ]);

      setPosts(postsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (error) {
      console.error('Error fetching blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || post.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name_ar || cat.name : null;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="المدونة - آخر المقالات والأخبار"
        description="اقرأ آخر المقالات والنصائح حول زيادة المتابعين وتحسين التفاعل على السوشيال ميديا"
        keywords="مدونة, مقالات, نصائح سوشيال ميديا, زيادة متابعين"
        canonicalUrl="/blog"
        ogType="website"
      />
      <JsonLd
        data={{
          type: 'BreadcrumbList',
          items: [
            { name: 'الرئيسية', url: '/' },
            { name: 'المدونة', url: '/blog' },
          ],
        }}
      />
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">المدونة</h1>
          <p className="text-muted-foreground">آخر المقالات والأخبار</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في المقالات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              الكل
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name_ar || cat.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">لا توجد مقالات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {post.featured_image && (
                  <img
                    src={post.featured_image}
                    alt={post.title_ar || post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardHeader>
                  <Link href={`/blog/${post.slug}`}>
                    <CardTitle className="text-lg hover:text-primary transition-colors line-clamp-2">
                      {post.title_ar || post.title}
                    </CardTitle>
                  </Link>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(post.published_at), 'dd MMM yyyy', { locale: ar })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views_count}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {post.excerpt && (
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {getCategoryName(post.category_id) && (
                      <Badge variant="secondary">{getCategoryName(post.category_id)}</Badge>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${post.slug}`}>
                        اقرأ المزيد
                        <ArrowLeft className="w-3 h-3 mr-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
