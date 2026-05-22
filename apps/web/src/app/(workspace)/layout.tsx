import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/shell/sidebar/Sidebar';
import MobileNav from '@/components/shell/mobile/MobileNav';
import Header from '@/components/shell/header/Header';
import WorkspaceBootstrap from '@/components/shell/workspace/WorkspaceBootstrap';
import ShellContent from '@/components/shell/layout/ShellContent';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <WorkspaceBootstrap userId={user.id} email={user.email ?? ''}>
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <MobileNav />
        <ShellContent>
          <div className="lg:hidden h-14 flex-shrink-0" />
          <Header />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </ShellContent>
      </div>
    </WorkspaceBootstrap>
  );
}
