import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'moderator' | 'support' | 'user';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  roles: AppRole[];
  permissions: string[];
}

export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    roles: [],
    permissions: [],
  });

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setState({ isAdmin: false, isLoading: false, roles: [], permissions: [] });
      return;
    }

    try {
      // Check user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        setState({ isAdmin: false, isLoading: false, roles: [], permissions: [] });
        return;
      }

      const roles = (rolesData?.map(r => r.role) || []) as AppRole[];
      const isAdmin = roles.includes('admin');

      // Fetch permissions for user's roles
      let permissions: string[] = [];
      if (roles.length > 0) {
        const { data: permData } = await supabase
          .from('role_permissions')
          .select('permission_id, permissions(name)')
          .in('role', roles);

        permissions = permData?.map((p: any) => p.permissions?.name).filter(Boolean) || [];
      }

      setState({
        isAdmin,
        isLoading: false,
        roles,
        permissions,
      });
    } catch (error) {
      console.error('Error checking admin status:', error);
      setState({ isAdmin: false, isLoading: false, roles: [], permissions: [] });
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading, checkAdminStatus]);

  const hasPermission = useCallback((permission: string) => {
    return state.isAdmin || state.permissions.includes(permission);
  }, [state.isAdmin, state.permissions]);

  const hasRole = useCallback((role: AppRole) => {
    return state.roles.includes(role);
  }, [state.roles]);

  return {
    ...state,
    hasPermission,
    hasRole,
    refreshAuth: checkAdminStatus,
  };
};
