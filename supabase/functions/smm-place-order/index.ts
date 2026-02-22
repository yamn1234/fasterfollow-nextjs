import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get the order with service and provider info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Get the service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*, api_providers(*)')
      .eq('id', order.service_id)
      .single();

    if (serviceError || !service) {
      throw new Error('Service not found');
    }

    if (!service.provider_id || !service.external_service_id) {
      throw new Error('Service is not linked to a provider');
    }

    const provider = service.api_providers;
    if (!provider || !provider.is_active) {
      throw new Error('Provider not found or inactive');
    }

    console.log(`Placing order ${orderId} via provider ${provider.name}`);

    // Build API request body
    const apiBody: Record<string, unknown> = {
      key: provider.api_key,
      action: 'add',
      service: service.external_service_id,
      link: order.link,
      quantity: order.quantity,
    };

    // Add comments if the service requires them
    // Comments should be separated by \n as per SMM API specification
    if (service.requires_comments && order.comments) {
      // Normalize line endings to \n (API expects \r\n or \n)
      const normalizedComments = order.comments
        .replace(/\r\n/g, '\n')  // Convert Windows line endings
        .replace(/\r/g, '\n')     // Convert old Mac line endings
        .trim();
      apiBody.comments = normalizedComments;
    }

    console.log('API Request Body:', { ...apiBody, key: '[REDACTED]' });

    // Call SMM Panel API to place order
    const apiResponse = await fetch(provider.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiBody),
    });

    const apiData = await apiResponse.json();
    console.log('Provider API Response:', apiData);

    if (apiData.error) {
      // Update order with error
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          error_message: apiData.error,
        })
        .eq('id', orderId);

      throw new Error(apiData.error);
    }

    // Get external order ID
    const externalOrderId = String(apiData.order || apiData.id || '');

    // Update order with external ID and status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        external_order_id: externalOrderId,
        provider_id: provider.id,
        status: 'processing',
        error_message: null,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        externalOrderId,
        message: 'تم إرسال الطلب للمزود بنجاح',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error placing order:', errorMessage);
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
