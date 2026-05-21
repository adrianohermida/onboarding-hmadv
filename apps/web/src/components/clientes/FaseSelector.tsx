'use client';

import { useState, useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';
import { toast } from 'sonner';

const FASES = Object.keys(FASE_LABELS) as (keyof typeof FASE_LABELS)[];

interface Props {
  casoId: string;
  userId: string;
  currentFase: string;
}

export default function FaseSelector({ casoId, userId, currentFase }: Props) {
  const [fase, setFase] = useState(currentFase);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function update(newFase: string) {
    if (newFase === fase) { setOpen(false); return; }
    setOpen(false);

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('portal_casos')
        .update({ fase: newFase })
        .eq('id', casoId);

      if (error) {
        toast.error('Erro ao atualizar fase');
      } else {
        setFase(newFase);
        toast.success('Fase atualizada');
      }
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-full"
      >
        <StatusBadge status={fase} labels={FASE_LABELS} />
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
            {FASES.map((f) => (
              <button
                key={f}
                onClick={() => update(f)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${f === fase ? 'font-medium' : ''}`}
              >
                <StatusBadge status={f} labels={FASE_LABELS} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
