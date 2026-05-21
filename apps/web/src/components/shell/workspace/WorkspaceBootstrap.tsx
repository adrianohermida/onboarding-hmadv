'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { createClient } from '@/lib/supabase/client';
import type { AuthUser } from '@/types';

interface Props {
  userId: string;
  email: string;
  children: React.ReactNode;
}

export default function WorkspaceBootstrap({ userId, email, children }: Props) {
  const { setUser } = useWorkspaceStore();

  useEffect(() => {
    async function bootstrap() {
      const supabase = createClient();
      const [{ data: adminData }, { data: profile }] = await Promise.all([
        supabase.from('admin_users').select('role').eq('user_id', userId).maybeSingle(),
        supabase.auth.getUser(),
      ]);

      const isAdmin = !!adminData;
      const meta = profile.user?.user_metadata ?? {};

      const user: AuthUser = {
        id: userId,
        email,
        role: adminData?.role === 'platform_admin' ? 'master_admin' : isAdmin ? 'tenant_admin' : 'cliente',
        isAdmin,
        workspaceId: null,
        nome: meta.nome ?? meta.full_name ?? undefined,
      };
      setUser(user);
    }
    bootstrap();
  }, [userId, email, setUser]);

  return <>{children}</>;
}
