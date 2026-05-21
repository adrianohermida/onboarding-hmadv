'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/store/workspace';
import type { AuthUser } from '@/types';

export function useAuth() {
  const { user, setUser } = useWorkspaceStore();
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setUser(null); setLoading(false); return; }

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const isAdmin = !!adminData;
      const role: AuthUser['role'] = adminData?.role === 'platform_admin'
        ? 'master_admin'
        : isAdmin
          ? 'tenant_admin'
          : 'cliente';

      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        role,
        isAdmin,
        workspaceId: null,
        nome: authUser.user_metadata?.nome ?? authUser.user_metadata?.full_name ?? undefined,
      });
      setLoading(false);
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setUser(null); setLoading(false); }
      if (event === 'SIGNED_IN') loadUser();
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return { user, loading };
}
