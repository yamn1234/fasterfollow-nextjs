import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.serve(async (req) => {
  console.log('service-meta function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const baseUrl = url.searchParams.get('baseUrl') || 'https://fasterfollow.net';

    console.log('Slug:', slug);

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Slug parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch service with SEO fields
    const { data: service, error } = await supabase
      .from('services')
      .select(`
        name, name_ar, description, description_ar, image_url,
        seo_title, seo_description, seo_keywords, 
        og_title, og_description, og_image
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!service) {
      console.log('Service not found for slug:', slug);
      return new Response(
        JSON.stringify({ error: 'Service not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Service found:', service.name);

    // Build meta tags
    const title = service.seo_title || service.name_ar || service.name;
    const description = service.seo_description || service.description_ar || service.description || '';
    const keywords = service.seo_keywords || '';
    const ogTitle = service.og_title || title;
    const ogDescription = service.og_description || description;
    const ogImage = service.og_image || service.image_url || '';
    const canonicalUrl = `${baseUrl}/services/${slug}`;

    // Return meta tags as JSON (can be used by Cloudflare Worker or as HTML)
    const metaTags = {
      title: `${title} | فاستر فولو`,
      description,
      keywords,
      og: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
        url: canonicalUrl,
        type: 'product',
      },
      twitter: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
        card: 'summary_large_image',
      },
      canonical: canonicalUrl,
    };

    // Check if HTML format is requested
    const format = url.searchParams.get('format');
    
    if (format === 'html') {
      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metaTags.title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="فاستر فولو">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  
  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
  <script>window.location.replace("${canonicalUrl}");</script>
</head>
<body>
  <p>جاري التحويل إلى <a href="${canonicalUrl}">${escapeHtml(service.name_ar || service.name)}</a>...</p>
</body>
</html>`;

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response(JSON.stringify(metaTags), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
