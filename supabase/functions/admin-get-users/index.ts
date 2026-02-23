import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin calling this endpoint (security)
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) throw new Error("Unauthorized");

    const { data: roleCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleCheck || (roleCheck.role !== 'admin' && roleCheck.role !== 'owner')) {
         throw new Error("Admin privileges required");
    }

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch all auth users (to get emails)
    const { data: authUsersResponse, error: authUsersError } = await supabase.auth.admin.listUsers();
    if (authUsersError) throw authUsersError;
    const authUsers = authUsersResponse.users;

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    if (rolesError) throw rolesError;

    // Merge everything
    const mergedUsers = profiles.map(profile => {
      const authUser = authUsers.find(u => u.id === profile.user_id);
      const userRole = roles.find(r => r.user_id === profile.user_id);
      
      return {
        ...profile,
        email: authUser?.email || null,
        role: userRole?.role || 'user'
      };
    });

    return new Response(JSON.stringify(mergedUsers), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching admin users:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
