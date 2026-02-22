import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map SMM Panel status to our status
function mapStatus(apiStatus: string): string {
  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'In progress': 'in_progress',
    'Processing': 'processing',
    'Completed': 'completed',
    'Partial': 'partial',
    'Canceled': 'cancelled',
    'Cancelled': 'cancelled',
    'Refunded': 'refunded',
    'Failed': 'failed',
    'Error': 'failed',
  };
  return statusMap[apiStatus] || apiStatus.toLowerCase().replace(/\s+/g, '_');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, checkAll = false } = await req.json();

    let ordersToCheck = [];

    if (checkAll) {
      // Get all orders with external_order_id that are not completed/cancelled/refunded
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, services(provider_id, api_providers(*))')
        .not('external_order_id', 'is', null)
        .not('status', 'in', '("completed","cancelled","refunded","failed")')
        .limit(100);

      if (error) throw error;
      ordersToCheck = orders || [];
    } else if (orderId) {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, services(provider_id, api_providers(*))')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      if (order) ordersToCheck = [order];
    } else {
      throw new Error('Order ID or checkAll flag is required');
    }

    console.log(`Checking status for ${ordersToCheck.length} orders`);

    const results = {
      checked: 0,
      updated: 0,
      errors: 0,
    };

    // Group orders by provider for batch API calls
    const ordersByProvider: Record<string, any[]> = {};
    
    for (const order of ordersToCheck) {
      const provider = order.services?.api_providers;
      if (!provider || !order.external_order_id) continue;
      
      if (!ordersByProvider[provider.id]) {
        ordersByProvider[provider.id] = [];
      }
      ordersByProvider[provider.id].push({ order, provider });
    }

    // Process each provider's orders
    for (const providerId of Object.keys(ordersByProvider)) {
      const providerOrders = ordersByProvider[providerId];
      const provider = providerOrders[0].provider;

      // Some APIs support batch status check
      const orderIds = providerOrders.map(o => o.order.external_order_id).join(',');

      try {
        const apiResponse = await fetch(provider.api_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: provider.api_key,
            action: 'status',
            orders: orderIds,
          }),
        });

        const apiData = await apiResponse.json();
        console.log(`Status response for provider ${provider.name}:`, apiData);

        // Handle single order response
        if (!Array.isArray(apiData) && typeof apiData === 'object') {
          // Single order or keyed response
          for (const { order } of providerOrders) {
            results.checked++;
            const externalId = order.external_order_id;
            const statusData = apiData[externalId] || apiData;

            if (statusData.status) {
              const newStatus = mapStatus(statusData.status);
              const startCount = parseInt(statusData.start_count) || null;
              const remains = parseInt(statusData.remains) || null;

              const updateData: any = {
                status: newStatus,
              };

              if (startCount !== null) updateData.start_count = startCount;
              if (remains !== null) updateData.remains = remains;
              if (newStatus === 'completed') updateData.completed_at = new Date().toISOString();

              const { error: updateError } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', order.id);

              if (updateError) {
                console.error(`Failed to update order ${order.id}:`, updateError);
                results.errors++;
              } else {
                results.updated++;
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error checking provider ${provider.name}:`, err);
        results.errors += providerOrders.length;
      }
    }

    console.log(`Status check complete:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        message: `تم فحص ${results.checked} طلب وتحديث ${results.updated}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking order status:', errorMessage);
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
