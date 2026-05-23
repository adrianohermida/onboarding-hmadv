'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare, Calendar, HelpCircle,
  Send, User, CheckCheck, Clock, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Mensagem {
  id: string;
  user_id: string | null;
  from_role: string;
  from_name: string | null;
  text: string;
  ts: string;
}

interface Agendamento {
  id: string;
  slot_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Slot {
  id: string;
  starts_at: string;
  ends_at: string | null;
  title: string | null;
  duration_min: number | null;
  location: string | null;
}

interface Props {
  mensagens: Mensagem[];
  agendamentos: Agendamento[];
  slots: Slot[];
  userId: string;
}

type Tab = 'mensagens' | 'agenda' | 'ajuda';

const TABS = [
  { id: 'mensagens' as Tab, label: 'Mensagens', icon: MessageSquare },
  { id: 'agenda'    as Tab, label: 'Agenda',    icon: Calendar },
  { id: 'ajuda'     as Tab, label: 'Ajuda',     icon: HelpCircle },
];

// ── Mensagens tab ─────────────────────────────────────────────────────────────

function MensagensTab({ initial, userId }: { initial: Mensagem[]; userId: string }) {
  const [texto, setTexto] = useState('');
  const qc = useQueryClient();
  const supabase = createClient();
  const queryKey = useMemo(() => ['atendimento-mensagens'], []);

  useEffect(() => {
    const channel = supabase
      .channel(`atendimento-mensagens:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 're_mensagens' }, () => {
        qc.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, queryKey, supabase, userId]);

  const { data: mensagens = initial } = useQuery<Mensagem[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('re_mensagens')
        .select('id, caso_id, remetente_id, conteudo, lida, criado_em, casos(nome_cliente)')
        .order('criado_em', { ascending: false })
        .limit(50);
      return data ?? [];
    },
    initialData: initial,
    staleTime: 15_000,
  });

  const enviar = useMutation({
    mutationFn: async (conteudo: string) => {
      const { error } = await supabase.from('re_mensagens').insert({
        remetente_id: userId,
        conteudo: conteudo.trim(),
        lida: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTexto('');
      qc.invalidateQueries({ queryKey: ['atendimento-mensagens'] });
    },
    onError: () => toast.error('Falha ao enviar mensagem'),
  });

  const naoLidas = mensagens.filter((m) => m.from_role !== 'user').length;

  return (
    <div className="flex flex-col gap-4">
      {naoLidas > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium">
          <CheckCheck className="h-4 w-4" />
          {naoLidas} mensagem{naoLidas > 1 ? 'ns' : ''} não lida{naoLidas > 1 ? 's' : ''}
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        {mensagens.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {[...mensagens].reverse().map((m) => {
              const isMine = m.from_role === 'user';
              return (
                <div key={m.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">
                      {isMine ? 'Você' : (m.from_name ?? 'Hermida Maia Advocacia')}
                    </p>
                    <p className="text-sm">{m.text}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                    {new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (texto.trim()) enviar.mutate(texto); }}
        className="flex gap-2"
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviar.isPending}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors hover:bg-primary/90 flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

// ── Agenda tab ────────────────────────────────────────────────────────────────

function AgendaTab({
  agendamentos,
  slots,
  userId,
}: {
  agendamentos: Agendamento[];
  slots: Slot[];
  userId: string;
}) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [obs, setObs] = useState('');
  const qc = useQueryClient();
  const supabase = createClient();

  const agendar = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('re_bookings').insert({
        slot_id: selectedSlot.id,
        user_id: user?.id,
        status: 'pendente',
        notes: obs || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agendamento solicitado');
      setSelectedSlot(null);
      setObs('');
    },
    onError: () => toast.error('Falha ao agendar'),
  });

  return (
    <div className="space-y-6">
      {/* Upcoming appointments */}
      {agendamentos.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3">Seus agendamentos</p>
          <div className="space-y-2">
            {agendamentos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
                <CheckCircle2 className={cn('h-5 w-5 flex-shrink-0', a.status === 'confirmado' ? 'text-green-500' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.notes ?? 'Atendimento'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  a.status === 'confirmado' ? 'bg-green-50 text-green-700' :
                  a.status === 'cancelado' ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-amber-700',
                )}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slot picker */}
      <div>
        <p className="text-sm font-semibold mb-3">Agendar atendimento</p>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum horário disponível no momento</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSlot(selectedSlot?.id === s.id ? null : s)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    selectedSlot?.id === s.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border bg-card hover:bg-muted/40',
                  )}
                >
                  <p className="text-xs font-semibold">
                    {new Date(s.starts_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{new Date(s.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {s.title && <p className="text-[10px] text-muted-foreground mt-0.5">{s.title}</p>}
                </button>
              ))}
            </div>

            {selectedSlot && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <p className="text-sm font-semibold">
                  {new Date(selectedSlot.starts_at).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {new Date(selectedSlot.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Observações (opcional)</label>
                  <textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Descreva o assunto do atendimento..."
                  />
                </div>
                <button
                  onClick={() => agendar.mutate()}
                  disabled={agendar.isPending}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors hover:bg-primary/90"
                >
                  {agendar.isPending ? 'Agendando...' : 'Confirmar agendamento'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ajuda tab ─────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'Como envio meus documentos?',
    a: 'Acesse a aba Documentos no menu lateral. Clique em "Enviar documento" e selecione o arquivo. Formatos aceitos: PDF, JPG, PNG.',
  },
  {
    q: 'Em quanto tempo recebo resposta?',
    a: 'Respondemos em até 24 horas úteis. Em casos urgentes, use o botão de mensagem para contato direto.',
  },
  {
    q: 'Como acompanho meu processo?',
    a: 'Acesse "Meu Caso" no menu lateral e clique na aba "Processos" para ver os andamentos mais recentes.',
  },
  {
    q: 'Quando vence minha próxima parcela?',
    a: 'Acesse "Meu Caso" → "Plano" para ver o detalhamento do seu plano de pagamento e parcelas.',
  },
  {
    q: 'Como agendar uma consulta?',
    a: 'Na aba Agenda aqui em Atendimento, escolha um horário disponível e confirme. Você receberá confirmação por e-mail.',
  },
];

function AjudaTab() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">Perguntas frequentes sobre seu atendimento</p>
      {FAQ.map((item, i) => (
        <div key={i} className="rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            {item.q}
            <HelpCircle className={cn('h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform', open === i && 'text-primary')} />
          </button>
          {open === i && (
            <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Hub ───────────────────────────────────────────────────────────────────────

export default function AtendimentoHub({ mensagens, agendamentos, slots, userId }: Props) {
  const [tab, setTab] = useState<Tab>('mensagens');
  const naoLidas = mensagens.filter((m) => m.from_role !== 'user').length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Atendimento</h2>
        <p className="text-sm text-muted-foreground">Mensagens, agendamentos e suporte</p>
      </div>

      <div className="flex gap-0.5 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {id === 'mensagens' && naoLidas > 0 && (
              <span className="ml-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                {naoLidas}
              </span>
            )}
          </button>
        ))}
      </div>

      <div>
        {tab === 'mensagens' && <MensagensTab initial={mensagens} userId={userId} />}
        {tab === 'agenda'    && <AgendaTab agendamentos={agendamentos} slots={slots} userId={userId} />}
        {tab === 'ajuda'     && <AjudaTab />}
      </div>
    </div>
  );
}
