'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface WorkspaceState {
  user: AuthUser | null;
  viewMode: 'cliente' | 'advogado' | 'admin';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeClientId: string | null;

  setUser: (user: AuthUser | null) => void;
  setViewMode: (mode: WorkspaceState['viewMode']) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveClient: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  viewMode: 'cliente' as const,
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeClientId: null,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set({ user }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setActiveClient: (activeClientId) => set({ activeClientId }),
      reset: () => set(initialState),
    }),
    {
      name: 'hmadv-workspace',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
