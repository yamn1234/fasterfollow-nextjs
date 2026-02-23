import { MetadataRoute } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://fasterfollow.site';

    // Base static routes
    const staticRoutes = [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/services`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/auth`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        },
    ];

    try {
        // Fetch all active services for dynamic routes
        const { data: services } = await supabase
            .from('services')
            .select('slug, updated_at')
            .eq('is_active', true);

        // Fetch all published and indexable blog posts
        const { data: posts } = await supabase
            .from('blog_posts')
            .select('slug, updated_at')
            .eq('status', 'published')
            .eq('is_archived', false)
            .eq('is_indexable', true);

        const dynamicRoutes = (services || []).map((service) => ({
            url: `${baseUrl}/services/${service.slug}`,
            lastModified: service.updated_at ? new Date(service.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        }));

        const dynamicBlogRoutes = (posts || []).map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

        return [...staticRoutes, ...dynamicRoutes, ...dynamicBlogRoutes];
    } catch (error) {
        console.error('Error generating sitemap:', error);
        // If Supabase fetch fails, at least return static routes
        return staticRoutes;
    }
}
