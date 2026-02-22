const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// Create JWT for Google API authentication
async function createJWT(serviceAccount: ServiceAccountKey): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = serviceAccount.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signatureB64}`;
}

// Get access token from Google
async function getAccessToken(serviceAccount: ServiceAccountKey): Promise<string> {
  const jwt = await createJWT(serviceAccount);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token error:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

function normalizeSiteUrl(input: string): string {
  const siteUrl = (input ?? '').trim();

  // Domain properties use this format in the Search Console API
  if (siteUrl.startsWith('sc-domain:')) return siteUrl;

  // URL-prefix properties must include the trailing slash (e.g. https://example.com/)
  if (/^https?:\/\//i.test(siteUrl)) {
    return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  }

  // If a bare domain was provided, assume https
  const assumed = `https://${siteUrl}`;
  return assumed.endsWith('/') ? assumed : `${assumed}/`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      console.error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Google Service Account not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { siteUrl, sitemapUrl } = await req.json();

    if (typeof siteUrl !== 'string' || typeof sitemapUrl !== 'string' || !siteUrl.trim() || !sitemapUrl.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'siteUrl and sitemapUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
    const normalizedSitemapUrl = sitemapUrl.trim();

    console.log('Submitting sitemap:', normalizedSitemapUrl, 'for site:', normalizedSiteUrl);

    const serviceAccount: ServiceAccountKey = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Submit sitemap to Google Search Console
    let apiSiteUrl = normalizedSiteUrl;
    let encodedSiteUrl = encodeURIComponent(apiSiteUrl);
    const encodedSitemapUrl = encodeURIComponent(normalizedSitemapUrl);
    
    const submitResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let finalSubmitResponse = submitResponse;
    let errorText = '';

    if (!finalSubmitResponse.ok) {
      errorText = await finalSubmitResponse.text();
      console.error('Sitemap submission error:', errorText);

      // If the site was verified as a Domain property in Search Console, the API expects:
      //   sc-domain:example.com
      if (finalSubmitResponse.status === 403 && !apiSiteUrl.startsWith('sc-domain:')) {
        try {
          const host = new URL(apiSiteUrl).hostname.replace(/^www\./, '');
          const domainProperty = `sc-domain:${host}`;
          const encodedDomainSiteUrl = encodeURIComponent(domainProperty);

          console.log('Retrying sitemap submission using domain property:', domainProperty);

          const retryResponse = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodedDomainSiteUrl}/sitemaps/${encodedSitemapUrl}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (retryResponse.ok) {
            apiSiteUrl = domainProperty;
            encodedSiteUrl = encodedDomainSiteUrl;
            finalSubmitResponse = retryResponse;
            errorText = '';
          } else {
            const retryError = await retryResponse.text();
            console.error('Domain property sitemap submission error:', retryError);
            finalSubmitResponse = retryResponse;
            errorText = retryError || errorText;
          }
        } catch (retryErr) {
          console.error('Domain property retry failed:', retryErr);
        }
      }
    }

    if (!finalSubmitResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to submit sitemap: ${finalSubmitResponse.status} - ${errorText}`,
        }),
        { status: finalSubmitResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get sitemap status
    const statusResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let status = null;
    if (statusResponse.ok) {
      status = await statusResponse.json();
    }

    console.log('Sitemap submitted successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sitemap submitted successfully',
        status 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error submitting sitemap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit sitemap';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
