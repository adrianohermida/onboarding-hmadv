'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ChevronRight, Users, X } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import type { ClienteSummary } from '@/types';
import { FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';

const FASE_OPTIONS = [
  { value: '', label: 'Todas as fases' },
  { value: 'cadastro', label: 'Cadastro' },
  { value: 'analise', label: 'Análise' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'arquivado', label: 'Arquivado' },
];

interface Props {
  clients: ClienteSummary[];
  search?: string;
  fase?: string;
  page: number;
}

export default function ClientesList({ clients, search = '', fase = '', page }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.fase) sp.set('fase', params.fase);
    if (params.page && params.page !== '1') sp.set('page', params.page);
    const q = sp.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(buildUrl({ search: searchValue || undefined, fase: fase || undefined }));
    });
  }

  function handleFase(value: string) {
    startTransition(() => {
      router.push(buildUrl({ search: search || undefined, fase: value || undefined }));
    });
  }

  function clearFilters() {
    setSearchValue('');
    startTransition(() => { router.push(pathname); });
  }

  const hasFilters = !!search || !!fase;

  const filtered = fase
    ? clients.filter((c) => c.fase === fase)
    : clients;

  return (
    <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar por nome, CPF ou e-mail..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-2">
        <select
          value={fase}
          onChange={(e) => handleFase(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {FASE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/60 transition-colors"
            title="Limpar filtros"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
        </div>
      </div>

      {/* Active filter summary */}
      {hasFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          {search && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
              "{search}"
            </span>
          )}
          {fase && (
            <span className="inline-flex items-center gap-1 bg-muted rounded-full px-2 py-0.5 font-medium">
              {FASE_LABELS[fase] ?? fase}
            </span>
          )}
        </div>
      )}

      {/* Table — desktop */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 font-medium">Contato</th>
              <th className="text-left px-4 py-3 font-medium">Fase</th>
              <th className="text-left px-4 py-3 font-medium">Onboarding</th>
              <th className="text-left px-4 py-3 font-medium">Desde</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr
                key={c.user_id}
                className="hover:bg-muted/40 transition-colors cursor-pointer group"
                onClick={() => router.push(`/clientes/${c.user_id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {getInitials(c.full_name)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.full_name || '—'}</p>
                      {c.cpf && <p className="text-xs text-muted-foreground">{c.cpf}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <p>{c.email || '—'}</p>
                  {c.telefone && <p className="text-xs">{c.telefone}</p>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.fase ?? 'cadastro'} labels={FASE_LABELS} />
                </td>
                <td className="px-4 py-3">
                  {c.onboarding_done ? (
                    <span className="text-xs text-green-600 font-medium">Concluído</span>
                  ) : (
                    <span className="text-xs text-amber-600">Em andamento</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-2">
        {filtered.map((c) => (
          <Link
            key={c.user_id}
            href={`/clientes/${c.user_id}`}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
              {getInitials(c.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{c.full_name || '—'}</p>
              <p className="text-xs text-muted-foreground truncate">{c.email || c.cpf || '—'}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={c.fase ?? 'cadastro'} labels={FASE_LABELS} />
              <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
