'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  MessageSquare, Send, User, ChevronLeft, Search, CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../ui/EmptyState';

interface Mensagem {
  id: string;
  user_id: string;
  from_role: string;
  from_name: string | null;
  text: string;
  ts: string;
}

interface Conversa {
  userId: string;
  nomeCliente: string;
  mensagens: Mensagem[];
  ultimaMensagem: Mensagem;
}

interface Props {
  isAdmin: boolean;
  currentUserId: string;
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDataCurta(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function useMensagens(isAdmin: boolean, currentUserId: string) {
  const supabase = createClient();
  const qc = useQueryClient();
  const queryKey = useMemo(() => ['mensagens', isAdmin, currentUserId], [currentUserId, isAdmin]);

  useEffect(() => {
    const channel = supabase
      .channel(`legacy-mensagens:${isAdmin ? 'admin' : currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 're_messages' }, () => {
        qc.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, isAdmin, qc, queryKey, supabase]);

  return useQuery<Mensagem[]>({
    queryKey: ['mensagens', isAdmin, currentUserId],
    queryFn: async () => {
      let q = supabase
        .from('re_messages')
        .select('id, user_id, from_role, from_name, text, ts')
        .order('ts', { ascending: false })
        .limit(500);
      if (!isAdmin) q = q.eq('user_id', currentUserId);
      const { data } = await q;
      return data ?? [];
    },
    staleTime: 15_000,
  });
}

function useEnviarMensagem(isAdmin: boolean, currentUserId: string) {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ targetUserId, text }: { targetUserId: string; text: string }) => {
      const { error } = await supabase.from('re_messages').insert({
        user_id: targetUserId,
        from_role: isAdmin ? 'admin' : 'user',
        from_name: null,
        text: text.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mensagens', isAdmin, currentUserId] }),
  });
}

function buildConversas(mensagens: Mensagem[]): Conversa[] {
  const map = new Map<string, Mensagem[]>();
  for (const m of mensagens) {
    if (!map.has(m.user_id)) map.set(m.user_id, []);
    map.get(m.user_id)!.push(m);
  }

  const conversas: Conversa[] = [];
  for (const [userId, msgs] of map.entries()) {
    const sorted = [...msgs].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    const clientMsg = msgs.find((m) => m.from_role !== 'admin' && m.from_role !== 'agent');
    conversas.push({
      userId,
      nomeCliente: clientMsg?.from_name ?? `Cliente ${userId.slice(0, 6)}`,
      mensagens: sorted,
      ultimaMensagem: sorted[sorted.length - 1],
    });
  }

  return conversas.sort((a, b) =>
    new Date(b.ultimaMensagem.ts).getTime() - new Date(a.ultimaMensagem.ts).getTime(),
  );
}

function ConversaItem({
  conversa,
  ativa,
  onClick,
  currentUserId,
}: {
  conversa: Conversa;
  ativa: boolean;
  onClick: () => void;
  currentUserId: string;
}) {
  const ultima = conversa.ultimaMensagem;
  const isMinha = ultima.user_id === currentUserId && ultima.from_role !== 'user';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors border-b border-border',
        ativa ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/40',
      )}
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
        {conversa.nomeCliente[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm truncate font-medium">{conversa.nomeCliente}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDataCurta(ultima.ts)}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isMinha && <CheckCheck className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
          <p className="text-xs truncate flex-1 text-muted-foreground">{ultima.text}</p>
        </div>
      </div>
    </button>
  );
}

function ThreadView({
  conversa,
  currentUserId,
  isAdmin,
  onBack,
}: {
  conversa: Conversa;
  currentUserId: string;
  isAdmin: boolean;
  onBack: () => void;
}) {
  const [texto, setTexto] = useState('');
  const enviar = useEnviarMensagem(isAdmin, currentUserId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversa.mensagens.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || enviar.isPending) return;
    const txt = texto;
    setTexto('');
    await enviar.mutateAsync({ targetUserId: conversa.userId, text: txt });
  }

  let lastDate = '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-background">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
          {conversa.nomeCliente[0]}
        </div>
        <div>
          <p className="text-sm font-semibold">{conversa.nomeCliente}</p>
          <p className="text-xs text-muted-foreground">
            {conversa.mensagens.length} mensage{conversa.mensagens.length !== 1 ? 'ns' : 'm'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {conversa.mensagens.map((m) => {
          const isMinha = isAdmin
            ? m.from_role === 'admin' || m.from_role === 'agent'
            : m.from_role === 'user';
          const dataLabel = formatDataCurta(m.ts);
          const showDate = dataLabel !== lastDate;
          lastDate = dataLabel;

          return (
            <div key={m.id}>
              {showDate && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground px-2">{dataLabel}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              <div className={cn('flex', isMinha ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2.5',
                  isMinha
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm',
                )}>
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  <p className={cn('text-[10px] mt-1 text-right', isMinha ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                    {formatHora(m.ts)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 px-4 py-3 border-t border-border flex-shrink-0 bg-background">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e as any); } }}
          placeholder="Digite uma mensagem..."
          rows={1}
          className="flex-1 resize-none px-3 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          style={{ minHeight: '38px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviar.isPending}
          className="flex-shrink-0 p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export default function MensagensClient({ isAdmin, currentUserId }: Props) {
  const { data: mensagens = [] } = useMensagens(isAdmin, currentUserId);
  const [search, setSearch] = useState('');
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);

  const conversas = isAdmin
    ? buildConversas(mensagens)
    : (mensagens.length > 0 ? [{ userId: currentUserId, nomeCliente: 'Minha conversa', mensagens: [...mensagens].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()), ultimaMensagem: mensagens[0] }] : []);

  const conversasFiltradas = search.trim()
    ? conversas.filter((c) => c.nomeCliente.toLowerCase().includes(search.toLowerCase()) ||
        c.ultimaMensagem.text.toLowerCase().includes(search.toLowerCase()))
    : conversas;

  const conversaAtual = conversaAtiva !== null
    ? conversas.find((c) => c.userId === conversaAtiva) ?? null
    : null;

  return (
    <div className="flex h-[calc(100vh-8rem)] border border-border rounded-xl overflow-hidden bg-background">
      {/* Lista de conversas */}
      <div className={cn(
        'flex flex-col border-r border-border bg-background',
        'w-full lg:w-72 lg:flex-shrink-0',
        conversaAtual && 'hidden lg:flex lg:flex-col',
      )}>
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold">Mensagens</p>
            {conversas.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                {conversas.length}
              </span>
            )}
          </div>
          {isAdmin && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversasFiltradas.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Nenhuma conversa"
              description={search ? 'Nenhuma conversa corresponde à busca.' : 'As mensagens aparecerão aqui.'}
            />
          ) : (
            conversasFiltradas.map((c) => (
              <ConversaItem
                key={c.userId}
                conversa={c}
                ativa={conversaAtiva === c.userId}
                onClick={() => setConversaAtiva(c.userId)}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={cn(
        'flex-1 flex flex-col',
        !conversaAtual && 'hidden lg:flex',
      )}>
        {conversaAtual ? (
          <ThreadView
            conversa={conversaAtual}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onBack={() => setConversaAtiva(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Selecione uma conversa"
              description="Escolha uma conversa na lista para visualizar e responder mensagens."
            />
          </div>
        )}
      </div>
    </div>
  );
}
