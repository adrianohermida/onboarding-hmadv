'use client';

import { useWorkspaceStore } from '@/store/workspace';
import { cn } from '@/lib/utils';

export default function ShellContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useWorkspaceStore();

  return (
    <div
      className={cn(
        'flex-1 flex flex-col min-w-0 transition-all duration-200',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56',
      )}
    >
      {children}
    </div>
  );
}
