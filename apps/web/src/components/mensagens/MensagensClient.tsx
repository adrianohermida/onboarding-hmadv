'use client';

import { MessageSquare, User } from 'lucide-react';

interface Mensagem {
  id: string;
  caso_id: string | null;
  remetente_id: string | null;
  conteudo: string;
  lida: boolean;
  criado_em: string;
  casos: { nome_cliente: string } | null;
}

interface Props {
  mensagens: Mensagem[];
  isAdmin: boolean;
  currentUserId: string;
}

export default function MensagensClient({ mensagens, currentUserId }: Props) {
  const naoLidas = mensagens.filter((m) => !m.lida).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mensagens</h2>
          <p className="text-sm text-muted-foreground">
            Comunicação com clientes
            {naoLidas > 0 && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">{naoLidas} não lida{naoLidas > 1 ? 's' : ''}</span>}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma mensagem</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mensagens.map((m) => {
              const isMine = m.remetente_id === currentUserId;
              return (
                <div key={m.id} className={`px-4 py-3 flex items-start gap-3 ${!m.lida ? 'bg-primary/5' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {isMine ? 'Você' : (m.casos?.nome_cliente ?? 'Cliente')}
                      </p>
                      {!m.lida && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{m.conteudo}</p>
                    {m.casos && !isMine && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5">Caso: {m.casos.nome_cliente}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(m.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
