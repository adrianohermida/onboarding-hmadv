'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criada_em: string;
}

interface Props {
  notificacoes?: Notificacao[];
}

export default function NotificationBell({ notificacoes = [] }: Props) {
  const [open, setOpen] = useState(false);
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        {naoLidas > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 w-80 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Notificações</h3>
              {naoLidas > 0 && (
                <span className="text-xs text-muted-foreground">{naoLidas} não lida{naoLidas > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nenhuma notificação</p>
              ) : (
                notificacoes.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 ${n.lida ? '' : 'bg-primary/5'}`}>
                    <p className="text-sm font-medium">{n.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.mensagem}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
