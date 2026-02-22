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

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const { providerId, categoryId, priceMultiplier = 1.0, action = 'import', selectedServices, serviceId } = await req.json();

    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    // Get the provider
    const { data: provider, error: providerError } = await supabase
      .from('api_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      throw new Error('Provider not found');
    }

    // If action is 'fetch_single', fetch a specific service by ID
    if (action === 'fetch_single') {
      if (!serviceId) {
        throw new Error('Service ID is required for fetch_single action');
      }

      console.log(`Fetching single service ${serviceId} from provider: ${provider.name}`);
      
      const apiResponse = await fetch(provider.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: provider.api_key,
          action: 'services',
        }),
      });

      const services = await apiResponse.json();
      
      if (!Array.isArray(services)) {
        throw new Error('Invalid response from provider API');
      }

      // Find the specific service
      const foundService = services.find((s: any) => 
        String(s.service || s.id) === String(serviceId)
      );

      if (!foundService) {
        throw new Error(`Service with ID ${serviceId} not found`);
      }

      const formattedService = {
        id: String(foundService.service || foundService.id),
        name: foundService.name || `Service ${foundService.service || foundService.id}`,
        category: foundService.category || 'Uncategorized',
        rate: parseFloat(foundService.rate || foundService.price || 0),
        min: parseInt(foundService.min || 1),
        max: parseInt(foundService.max || 10000),
        description: foundService.description || foundService.desc || null,
        speed: foundService.average_time || foundService.speed || null,
      };

      return new Response(
        JSON.stringify({
          success: true,
          service: formattedService,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If action is 'fetch', just return services list for selection
    if (action === 'fetch') {
      console.log(`Fetching services list from provider: ${provider.name}`);
      
      const apiResponse = await fetch(provider.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: provider.api_key,
          action: 'services',
        }),
      });

      const services = await apiResponse.json();
      console.log(`Received ${Array.isArray(services) ? services.length : 0} services from API`);

      if (!Array.isArray(services)) {
        throw new Error('Invalid response from provider API');
      }

      // Return formatted services for selection
      const formattedServices = services.map((service: any) => ({
        id: String(service.service || service.id),
        name: service.name || `Service ${service.service || service.id}`,
        category: service.category || 'Uncategorized',
        rate: parseFloat(service.rate || service.price || 0),
        min: parseInt(service.min || 1),
        max: parseInt(service.max || 10000),
        description: service.description || service.desc || null,
        speed: service.average_time || service.speed || null,
      }));

      return new Response(
        JSON.stringify({
          success: true,
          services: formattedServices,
          total: formattedServices.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Import selected services or all services
    console.log(`Importing services from provider: ${provider.name}`);

    let servicesToImport = selectedServices;

    // If no selected services, fetch all from API
    if (!servicesToImport || servicesToImport.length === 0) {
      const apiResponse = await fetch(provider.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: provider.api_key,
          action: 'services',
        }),
      });

      servicesToImport = await apiResponse.json();
      
      if (!Array.isArray(servicesToImport)) {
        throw new Error('Invalid response from provider API');
      }
    }

    console.log(`Processing ${servicesToImport.length} services for import`);

    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const service of servicesToImport) {
      try {
        const externalId = String(service.service || service.id);
        const name = service.name || `Service ${externalId}`;
        const price = parseFloat(service.rate || service.price || 0) * priceMultiplier;
        const minQty = parseInt(service.min || 1);
        const maxQty = parseInt(service.max || 10000);
        const description = service.description || service.desc || null;
        const speed = service.average_time || service.speed || null;
        const slug = `${provider.name.toLowerCase().replace(/\s+/g, '-')}-${externalId}`;

        // Check if service already exists
        const { data: existing } = await supabase
          .from('services')
          .select('id')
          .eq('external_service_id', externalId)
          .eq('provider_id', providerId)
          .maybeSingle();

        if (existing) {
          // Update existing service
          const { error: updateError } = await supabase
            .from('services')
            .update({
              name,
              description,
              price,
              min_quantity: minQty,
              max_quantity: maxQty,
              delivery_time: speed,
              is_active: true,
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Failed to update service ${externalId}:`, updateError);
            failed++;
          } else {
            updated++;
          }
        } else {
          // Insert new service
          const { error: insertError } = await supabase
            .from('services')
            .insert({
              name,
              slug,
              description,
              price,
              min_quantity: minQty,
              max_quantity: maxQty,
              delivery_time: speed,
              provider_id: providerId,
              external_service_id: externalId,
              category_id: categoryId || null,
              is_active: true,
              is_archived: false,
            });

          if (insertError) {
            console.error(`Failed to import service ${externalId}:`, insertError);
            failed++;
          } else {
            imported++;
          }
        }
      } catch (err) {
        console.error('Error processing service:', err);
        failed++;
      }
    }

    console.log(`Import complete: ${imported} imported, ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        updated,
        failed,
        total: servicesToImport.length,
        message: `تم استيراد ${imported} خدمة جديدة وتحديث ${updated} خدمة`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error importing services:', errorMessage);
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
