"use client";

import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import PageView from './Page';
import BlogPostView from './BlogPost';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface DynamicContentViewProps {
    initialData?: any;
    initialType?: 'page' | 'blog' | null;
}

const DynamicContentView = ({ initialData, initialType }: DynamicContentViewProps) => {
    const { slug } = useParams<{ slug: string }>();
    const [contentType, setContentType] = useState<'page' | 'blog' | null>(initialType || null);
    const [loading, setLoading] = useState(!initialType);

    useEffect(() => {
        if (!contentType || !initialData) {
            identifyContent();
        } else {
            setLoading(false);
        }
    }, [slug]);

    const identifyContent = async () => {
        try {
            // 1. Try to find if it's a page
            const { data: page } = await supabase
                .from('pages')
                .select('id')
                .eq('slug', slug)
                .eq('is_published', true)
                .eq('is_archived', false)
                .maybeSingle();

            if (page) {
                setContentType('page');
                setLoading(false);
                return;
            }

            // 2. Try to find if it's a blog post
            const { data: post } = await supabase
                .from('blog_posts')
                .select('id')
                .eq('slug', slug)
                .eq('status', 'published')
                .eq('is_archived', false)
                .maybeSingle();

            if (post) {
                setContentType('blog');
                setLoading(false);
                return;
            }

            // 3. Neither found
            setContentType(null);
        } catch (error) {
            console.error('Error identifying content:', error);
            setContentType(null);
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

    if (contentType === 'page') {
        return <PageView initialData={initialData} />;
    }

    if (contentType === 'blog') {
        return <BlogPostView initialPost={initialData} />;
    }

    // Not Found state
    return (
        <div className="min-h-screen bg-background">
            <SEOHead
                title="الصفحة غير موجودة"
                description="الصفحة التي تبحث عنها غير متوفرة"
                noIndex
            />
            <Header />
            <main className="container py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">المحتوى غير موجود</h1>
                <p className="text-muted-foreground mb-6">المقال أو الصفحة التي تبحث عنها غير متوفرة حالياً.</p>
                <Button asChild>
                    <Link href="/">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للرئيسية
                    </Link>
                </Button>
            </main>
            <Footer />
        </div>
    );
};

export default DynamicContentView;
