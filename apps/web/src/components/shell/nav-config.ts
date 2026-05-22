import {
  LayoutDashboard, Users, Gavel, Clock, CalendarDays, Newspaper,
  CheckSquare, DollarSign, Receipt, FileCheck,
  MessageSquare, Calendar, HelpCircle,
  GitBranch, Settings, Scale,
} from 'lucide-react';
import type { useSidebarCounts } from '@/lib/hooks/use-sidebar-counts';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: keyof ReturnType<typeof useSidebarCounts>;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const ADMIN_SECTIONS: NavSection[] = [
  {
    label: 'Painel',
    items: [
      { href: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
      { href: '/timeline',  label: 'Timeline',     icon: GitBranch },
    ],
  },
  {
    label: 'Operações',
    items: [
      { href: '/clientes',    label: 'Clientes',    icon: Users },
      { href: '/processos',   label: 'Processos',   icon: Gavel },
      { href: '/publicacoes', label: 'Publicações', icon: Newspaper, countKey: 'publicacoes' },
      { href: '/prazos',      label: 'Prazos',      icon: Clock },
      { href: '/tarefas',     label: 'Tarefas',     icon: CheckSquare, countKey: 'tarefas' },
      { href: '/agenda',      label: 'Agenda',      icon: CalendarDays },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/financeiro', label: 'Honorários',  icon: DollarSign },
      { href: '/custas',     label: 'Custas',      icon: Receipt },
      { href: '/contratos',  label: 'Contratos',   icon: FileCheck },
    ],
  },
  {
    label: 'Relacionamento',
    items: [
      { href: '/mensagens',   label: 'Mensagens',  icon: MessageSquare, countKey: 'mensagens' },
      { href: '/atendimento', label: 'Atendimento', icon: HelpCircle },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
];

// ── Cliente — 4 hubs apenas ───────────────────────────────────────────────────

export const CLIENT_SECTIONS: NavSection[] = [
  {
    label: '',
    items: [
      { href: '/dashboard',   label: 'Painel',      icon: LayoutDashboard },
      { href: '/meu-caso',    label: 'Meu Caso',    icon: Scale },
      { href: '/financeiro',  label: 'Financeiro',  icon: DollarSign },
      { href: '/documentos',  label: 'Documentos',  icon: FileCheck, countKey: 'documentos' },
      { href: '/atendimento', label: 'Atendimento', icon: Calendar },
      { href: '/mensagens',   label: 'Mensagens',   icon: MessageSquare, countKey: 'mensagens' },
    ],
  },
];
