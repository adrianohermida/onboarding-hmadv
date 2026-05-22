import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/shell/sidebar/Sidebar';
import MobileNav from '@/components/shell/mobile/MobileNav';
import Header from '@/components/shell/header/Header';
import WorkspaceBootstrap from '@/components/shell/workspace/WorkspaceBootstrap';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <WorkspaceBootstrap userId={user.id} email={user.email ?? ''}>
      <div className="min-h-screen flex">
        {/* Persistent sidebar — desktop */}
        <Sidebar />

        {/* Mobile navigation */}
        <MobileNav />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-56 transition-all duration-200" id="workspace-main">
          {/* Sticky header */}
          <div className="lg:hidden h-14" /> {/* Spacer for mobile top bar */}
          <Header />

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </WorkspaceBootstrap>
  );
}
