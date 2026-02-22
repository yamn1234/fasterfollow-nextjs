import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to format date to ISO-8601 (YYYY-MM-DD)
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Helper to escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the base URL from request or use production domain
    const url = new URL(req.url);
    const baseUrl = url.searchParams.get('baseUrl') || 'https://fasterfollow.net';

    // Static pages with proper priorities
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/services', priority: '0.9', changefreq: 'daily' },
      { loc: '/blog', priority: '0.8', changefreq: 'daily' },
      { loc: '/llm.html', priority: '0.5', changefreq: 'monthly' },
    ];

    // Fetch all active services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('slug, updated_at, is_indexable')
      .eq('is_active', true)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true });

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
    }

    // Fetch all published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, is_indexable')
      .eq('status', 'published')
      .eq('is_archived', false)
      .order('published_at', { ascending: false });

    if (blogError) {
      console.error('Error fetching blog posts:', blogError);
    }

    // Fetch all published pages
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('slug, updated_at, is_indexable')
      .eq('is_published', true)
      .eq('is_archived', false);

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
    }

    // Fetch active service categories (for potential category pages)
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }

    // Build XML sitemap following sitemaps.org protocol
    const xmlParts: string[] = [];
    
    // XML declaration and urlset opening
    xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlParts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    // Add static pages
    const today = formatDate(new Date().toISOString());
    for (const page of staticPages) {
      xmlParts.push('  <url>');
      xmlParts.push(`    <loc>${escapeXml(baseUrl + page.loc)}</loc>`);
      xmlParts.push(`    <lastmod>${today}</lastmod>`);
      xmlParts.push(`    <changefreq>${page.changefreq}</changefreq>`);
      xmlParts.push(`    <priority>${page.priority}</priority>`);
      xmlParts.push('  </url>');
    }

    // Add services (only indexable ones)
    if (services) {
      for (const service of services) {
        // Skip non-indexable services
        if (service.is_indexable === false) continue;
        
        xmlParts.push('  <url>');
        xmlParts.push(`    <loc>${escapeXml(baseUrl + '/services/' + service.slug)}</loc>`);
        xmlParts.push(`    <lastmod>${formatDate(service.updated_at)}</lastmod>`);
        xmlParts.push('    <changefreq>weekly</changefreq>');
        xmlParts.push('    <priority>0.8</priority>');
        xmlParts.push('  </url>');
      }
    }

    // Add blog posts (only indexable ones)
    if (blogPosts) {
      for (const post of blogPosts) {
        // Skip non-indexable posts
        if (post.is_indexable === false) continue;
        
        xmlParts.push('  <url>');
        xmlParts.push(`    <loc>${escapeXml(baseUrl + '/blog/' + post.slug)}</loc>`);
        xmlParts.push(`    <lastmod>${formatDate(post.updated_at)}</lastmod>`);
        xmlParts.push('    <changefreq>monthly</changefreq>');
        xmlParts.push('    <priority>0.7</priority>');
        xmlParts.push('  </url>');
      }
    }

    // Add pages (only indexable ones)
    if (pages) {
      for (const page of pages) {
        // Skip non-indexable pages
        if (page.is_indexable === false) continue;
        
        xmlParts.push('  <url>');
        xmlParts.push(`    <loc>${escapeXml(baseUrl + '/page/' + page.slug)}</loc>`);
        xmlParts.push(`    <lastmod>${formatDate(page.updated_at)}</lastmod>`);
        xmlParts.push('    <changefreq>monthly</changefreq>');
        xmlParts.push('    <priority>0.6</priority>');
        xmlParts.push('  </url>');
      }
    }

    // Close urlset
    xmlParts.push('</urlset>');

    const xml = xmlParts.join('\n');

    // Calculate counts for logging
    const serviceCount = services?.filter(s => s.is_indexable !== false).length || 0;
    const blogCount = blogPosts?.filter(b => b.is_indexable !== false).length || 0;
    const pageCount = pages?.filter(p => p.is_indexable !== false).length || 0;
    const totalUrls = staticPages.length + serviceCount + blogCount + pageCount;

    console.log(`Generated sitemap: ${totalUrls} URLs (${staticPages.length} static, ${serviceCount} services, ${blogCount} blog posts, ${pageCount} pages)`);

    // Check if download is requested
    const download = url.searchParams.get('download') === 'true';
    
    const headers: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff',
    };

    if (download) {
      headers['Content-Disposition'] = 'attachment; filename="sitemap.xml"';
    }

    return new Response(xml, { 
      status: 200,
      headers 
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/xml; charset=utf-8' 
        } 
      }
    );
  }
});
