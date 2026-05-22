import {
  LayoutDashboard, Users, FileText, CreditCard, TrendingDown,
  DollarSign, Calendar, CheckSquare, MessageSquare, Gavel, Newspaper,
  Scale, FileCheck, Receipt, HelpCircle,
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

export const ADMIN_SECTIONS: NavSection[] = [
  {
    label: 'Jurídico',
    items: [
      { href: '/dashboard',    label: 'Painel',       icon: LayoutDashboard },
      { href: '/clientes',     label: 'Clientes',     icon: Users },
      { href: '/processos',    label: 'Processos',    icon: Gavel },
      { href: '/publicacoes',  label: 'Publicações',  icon: Newspaper,    countKey: 'publicacoes' },
      { href: '/tarefas',      label: 'Tarefas',      icon: CheckSquare,  countKey: 'tarefas' },
    ],
  },
  {
    label: 'Rotina',
    items: [
      { href: '/agenda',       label: 'Agenda',       icon: Calendar },
      { href: '/documentos',   label: 'Documentos',   icon: FileText,     countKey: 'documentos' },
      { href: '/mensagens',    label: 'Mensagens',    icon: MessageSquare, countKey: 'mensagens' },
      { href: '/financeiro',   label: 'Financeiro',   icon: DollarSign },
    ],
  },
];

export const CLIENT_SECTIONS: NavSection[] = [
  {
    label: 'Processo',
    items: [
      { href: '/dashboard',    label: 'Painel',       icon: LayoutDashboard },
      { href: '/onboarding',   label: 'Meu Caso',     icon: Scale },
      { href: '/documentos',   label: 'Documentos',   icon: FileText,     countKey: 'documentos' },
      { href: '/contratos',    label: 'Contratos',    icon: FileCheck },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/planos',       label: 'Plano',        icon: CreditCard },
      { href: '/custas',       label: 'Custas',       icon: Receipt },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { href: '/agenda',       label: 'Agenda',       icon: Calendar },
      { href: '/mensagens',    label: 'Mensagens',    icon: MessageSquare, countKey: 'mensagens' },
      { href: '/ajuda',        label: 'Ajuda',        icon: HelpCircle },
    ],
  },
];
