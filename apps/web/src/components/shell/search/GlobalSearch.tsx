'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Gavel, Users, CheckSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalSearch, type SearchResult } from '@/lib/hooks/use-global-search';

const TIPO_CONFIG: Record<SearchResult['tipo'], { label: string; Icon: React.ElementType; cls: string }> = {
  publicacao: { label: 'Publicação',  Icon: FileText,    cls: 'text-violet-500' },
  processo:   { label: 'Processo',    Icon: Gavel,       cls: 'text-blue-500'   },
  cliente:    { label: 'Cliente',     Icon: Users,       cls: 'text-emerald-500' },
  tarefa:     { label: 'Tarefa',      Icon: CheckSquare, cls: 'text-amber-500'  },
};

const TIPO_ORDER: SearchResult['tipo'][] = ['publicacao', 'processo', 'cliente', 'tarefa'];

function groupResults(results: SearchResult[]) {
  const map = new Map<SearchResult['tipo'], SearchResult[]>();
  for (const r of results) {
    if (!map.has(r.tipo)) map.set(r.tipo, []);
    map.get(r.tipo)!.push(r);
  }
  return TIPO_ORDER.map((tipo) => ({ tipo, items: map.get(tipo) ?? [] })).filter((g) => g.items.length > 0);
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results = [], isFetching } = useGlobalSearch(query, 6);
  const groups = groupResults(results);
  const flat = results;

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === 'Enter' && cursor >= 0 && flat[cursor]) {
        navigate(flat[cursor].href);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, cursor, flat, navigate, onClose]);

  if (!open) return null;

  let flatIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {isFetching
            ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0" />
            : <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(-1); }}
            placeholder="Buscar publicações, processos, clientes, tarefas..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {query.trim().length < 2 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Digite pelo menos 2 caracteres para buscar
            </p>
          )}

          {query.trim().length >= 2 && !isFetching && results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
          )}

          {groups.map(({ tipo, items }) => {
            const cfg = TIPO_CONFIG[tipo];
            return (
              <div key={tipo}>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-b border-border">
                  {cfg.label}s
                </div>
                {items.map((r) => {
                  const idx = flatIdx++;
                  const active = cursor === idx;
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigate(r.href)}
                      onMouseEnter={() => setCursor(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-border/50 last:border-0',
                        active ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/50 text-foreground',
                      )}
                    >
                      <cfg.Icon className={cn('h-4 w-4 flex-shrink-0', cfg.cls)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.titulo}</p>
                        {r.subtitulo && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{r.subtitulo}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span><kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono mr-1">↑↓</kbd> navegar</span>
            <span><kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono mr-1">↵</kbd> abrir</span>
            <span><kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono mr-1">ESC</kbd> fechar</span>
          </div>
        )}
      </div>
    </div>
  );
}
