'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  MessageSquare, Send, User, ChevronLeft, Search, CheckCheck, Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../ui/EmptyState';

interface Mensagem {
  id: string;
  caso_id: string | null;
  remetente_id: string | null;
  conteudo: string;
  lida: boolean;
  criado_em: string;
  casos: { nome_cliente: string } | null;
}

interface Conversa {
  casoId: string | null;
  nomeCliente: string;
  mensagens: Mensagem[];
  naoLidas: number;
  ultimaMensagem: Mensagem;
}

interface Props {
  mensagens: Mensagem[];
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

function useMensagens(initial: Mensagem[]) {
  const supabase = createClient();
  return useQuery<Mensagem[]>({
    queryKey: ['mensagens'],
    queryFn: async () => {
      const { data } = await supabase
        .from('re_mensagens')
        .select('id, caso_id, remetente_id, conteudo, lida, criado_em, casos(nome_cliente)')
        .order('criado_em', { ascending: false })
        .limit(200);
      return data ?? [];
    },
    initialData: initial,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

function useEnviarMensagem() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ casoId, conteudo }: { casoId: string | null; conteudo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('re_mensagens').insert({
        caso_id: casoId,
        remetente_id: user?.id,
        conteudo: conteudo.trim(),
        lida: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mensagens'] }),
  });
}

function useMarcarLida() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return;
      await supabase.from('re_mensagens').update({ lida: true }).in('id', ids);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mensagens'] }),
  });
}

function buildConversas(mensagens: Mensagem[]): Conversa[] {
  const map = new Map<string, Mensagem[]>();
  for (const m of mensagens) {
    const key = m.caso_id ?? 'sem-caso';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }

  const conversas: Conversa[] = [];
  for (const [casoId, msgs] of map.entries()) {
    const sorted = [...msgs].sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
    conversas.push({
      casoId: casoId === 'sem-caso' ? null : casoId,
      nomeCliente: msgs[0].casos?.nome_cliente ?? 'Geral',
      mensagens: sorted,
      naoLidas: msgs.filter((m) => !m.lida).length,
      ultimaMensagem: sorted[sorted.length - 1],
    });
  }

  return conversas.sort((a, b) =>
    new Date(b.ultimaMensagem.criado_em).getTime() - new Date(a.ultimaMensagem.criado_em).getTime(),
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
  const isMinha = ultima.remetente_id === currentUserId;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors border-b border-border',
        ativa ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/40',
      )}
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
        {conversa.nomeCliente.split(' ')[0][0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm truncate', conversa.naoLidas > 0 ? 'font-semibold' : 'font-medium')}>
            {conversa.nomeCliente}
          </p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDataCurta(ultima.criado_em)}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {isMinha && <CheckCheck className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
          <p className={cn('text-xs truncate flex-1', conversa.naoLidas > 0 ? 'text-foreground' : 'text-muted-foreground')}>
            {ultima.conteudo}
          </p>
          {conversa.naoLidas > 0 && (
            <span className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {conversa.naoLidas}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ThreadView({
  conversa,
  currentUserId,
  onBack,
}: {
  conversa: Conversa;
  currentUserId: string;
  onBack: () => void;
}) {
  const [texto, setTexto] = useState('');
  const enviar = useEnviarMensagem();
  const marcarLida = useMarcarLida();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    const naoLidas = conversa.mensagens.filter((m) => !m.lida && m.remetente_id !== currentUserId).map((m) => m.id);
    if (naoLidas.length > 0) marcarLida.mutate(naoLidas);
  }, [conversa.mensagens.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || enviar.isPending) return;
    const txt = texto;
    setTexto('');
    await enviar.mutateAsync({ casoId: conversa.casoId, conteudo: txt });
  }

  let lastDate = '';

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-background">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
          {conversa.nomeCliente.split(' ')[0][0]}
        </div>
        <div>
          <p className="text-sm font-semibold">{conversa.nomeCliente}</p>
          <p className="text-xs text-muted-foreground">{conversa.mensagens.length} mensage{conversa.mensagens.length !== 1 ? 'ns' : 'm'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {conversa.mensagens.map((m) => {
          const isMinha = m.remetente_id === currentUserId;
          const dataLabel = formatDataCurta(m.criado_em);
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
                  <p className="text-sm leading-relaxed">{m.conteudo}</p>
                  <p className={cn('text-[10px] mt-1 text-right', isMinha ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                    {formatHora(m.criado_em)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
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

export default function MensagensClient({ mensagens: initial, isAdmin, currentUserId }: Props) {
  const { data: mensagens = initial } = useMensagens(initial);
  const [search, setSearch] = useState('');
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);

  const conversas = buildConversas(mensagens);
  const totalNaoLidas = mensagens.filter((m) => !m.lida && m.remetente_id !== currentUserId).length;

  const conversasFiltradas = search.trim()
    ? conversas.filter((c) => c.nomeCliente.toLowerCase().includes(search.toLowerCase()) ||
        c.ultimaMensagem.conteudo.toLowerCase().includes(search.toLowerCase()))
    : conversas;

  const conversaAtual = conversaAtiva !== null
    ? conversas.find((c) => (c.casoId ?? 'sem-caso') === conversaAtiva) ?? null
    : null;

  return (
    <div className="flex h-[calc(100vh-8rem)] border border-border rounded-xl overflow-hidden bg-background">
      {/* Lista de conversas */}
      <div className={cn(
        'flex flex-col border-r border-border bg-background',
        'w-full lg:w-72 lg:flex-shrink-0',
        conversaAtual && 'hidden lg:flex lg:flex-col',
      )}>
        {/* Header lista */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold">Mensagens</p>
            {totalNaoLidas > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                {totalNaoLidas}
              </span>
            )}
          </div>
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
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {conversasFiltradas.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Nenhuma conversa"
              description={search ? 'Nenhuma conversa corresponde à busca.' : 'As mensagens dos clientes aparecerão aqui.'}
            />
          ) : (
            conversasFiltradas.map((c) => (
              <ConversaItem
                key={c.casoId ?? 'sem-caso'}
                conversa={c}
                ativa={conversaAtiva === (c.casoId ?? 'sem-caso')}
                onClick={() => setConversaAtiva(c.casoId ?? 'sem-caso')}
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
