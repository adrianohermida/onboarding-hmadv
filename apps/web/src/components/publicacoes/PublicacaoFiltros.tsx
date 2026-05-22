'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import type { PublicacaoFiltros as FiltrosType } from './types';
import { FILTROS_DEFAULT } from './types';

interface Props {
  filtros: FiltrosType;
  onChange: (f: FiltrosType) => void;
}

const URGENCIA_OPTIONS = [
  { value: '', label: 'Qualquer urgência' },
  { value: 'normal', label: 'Normal' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'critica', label: 'Crítica' },
];

const PERIODO_OPTIONS = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'todos', label: 'Todos' },
];

const TEM_PRAZO_OPTIONS = [
  { value: '', label: 'Com ou sem prazo' },
  { value: 'sim', label: 'Com prazo' },
  { value: 'nao', label: 'Sem prazo' },
];

export default function PublicacaoFiltros({ filtros, onChange }: Props) {
  const [aberto, setAberto] = useState(false);

  function set(field: keyof FiltrosType) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ ...filtros, [field]: e.target.value });
    };
  }

  const temFiltrosAtivos =
    filtros.urgencia ||
    filtros.temPrazo ||
    filtros.tipoAto ||
    filtros.periodo !== '30d';

  function limpar() {
    onChange(FILTROS_DEFAULT);
  }

  return (
    <div className="space-y-2">
      {/* Search + toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={filtros.search}
            onChange={set('search')}
            placeholder="Buscar por processo, cliente, conteúdo..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/60"
          />
          {filtros.search && (
            <button
              onClick={() => onChange({ ...filtros, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setAberto(!aberto)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
            aberto || temFiltrosAtivos
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {temFiltrosAtivos && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>

        {temFiltrosAtivos && (
          <button
            onClick={limpar}
            className="flex items-center gap-1 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {aberto && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-3 rounded-xl border border-border bg-card/60">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Urgência</label>
            <select
              value={filtros.urgencia}
              onChange={set('urgencia')}
              className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {URGENCIA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Período</label>
            <select
              value={filtros.periodo}
              onChange={set('periodo')}
              className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {PERIODO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Prazo</label>
            <select
              value={filtros.temPrazo}
              onChange={set('temPrazo')}
              className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {TEM_PRAZO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de ato</label>
            <input
              type="text"
              value={filtros.tipoAto}
              onChange={set('tipoAto')}
              placeholder="Ex: Despacho..."
              className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      )}
    </div>
  );
}
