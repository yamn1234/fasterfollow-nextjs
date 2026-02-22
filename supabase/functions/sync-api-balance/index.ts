import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { providerId } = await req.json();

    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    // Get the provider
    const { data: provider, error: providerError } = await supabase
      .from('api_providers')
      .select('*')
      .eq('id', providerId)
      .eq('user_id', user.id)
      .single();

    if (providerError || !provider) {
      throw new Error('Provider not found');
    }

    console.log(`Syncing balance for provider: ${provider.name}`);

    // Call SMM Panel API to get balance
    const apiResponse = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: provider.api_key,
        action: 'balance',
      }),
    });

    const apiData = await apiResponse.json();
    console.log('API Response:', apiData);

    let balance = 0;
    let currency = 'USD';

    // Handle different API response formats
    if (apiData.balance !== undefined) {
      balance = parseFloat(apiData.balance) || 0;
    }
    if (apiData.currency) {
      currency = apiData.currency;
    }

    // Update provider balance in database
    const { error: updateError } = await supabase
      .from('api_providers')
      .update({
        balance: balance,
        currency: currency,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', providerId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to update balance');
    }

    return new Response(
      JSON.stringify({
        success: true,
        balance: balance,
        currency: currency,
        message: 'Balance synced successfully',
      }),
      {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Error syncing balance:', errorMessage);
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
});
