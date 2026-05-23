'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, CheckCheck, MessageSquare, Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../ui/EmptyState';
import { useRealtimeConversation, useRealtimeInbox } from '@/features/conversational/useRealtimeInbox';
import type { CrmConversation, CrmMessage } from '@/features/conversational/types';

interface Props {
  isAdmin: boolean;
  currentUserId: string;
  tenantId: string | null;
}

const STAFF_ROLES = new Set(['admin', 'superadmin', 'advogado', 'operador']);

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDataCurta(iso: string | null) {
  if (!iso) return '';
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return 'Hoje';
  if (data.toDateString() === ontem.toDateString()) return 'Ontem';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function conversationTitle(conversa: CrmConversation, isAdmin: boolean) {
  if (!isAdmin) return 'Minha conversa';
  return conversa.contact_name || conversa.case_client_name || conversa.title || 'Atendimento';
}

function isMine(message: CrmMessage, isAdmin: boolean, currentUserId: string) {
  if (message.sender_user_id === currentUserId) return true;
  return isAdmin ? STAFF_ROLES.has(message.sender_role) : message.sender_role === 'client';
}

function ConversaItem({
  conversa,
  ativa,
  isAdmin,
  onClick,
}: {
  conversa: CrmConversation;
  ativa: boolean;
  isAdmin: boolean;
  onClick: () => void;
}) {
  const title = conversationTitle(conversa, isAdmin);
  const unread = isAdmin ? conversa.unread_staff_count : conversa.unread_client_count;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full border-b border-border px-4 py-3.5 text-left transition-colors',
        'flex items-start gap-3',
        ativa ? 'border-l-2 border-l-primary bg-primary/5' : 'hover:bg-muted/40',
      )}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">
        {title.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <span className="flex-shrink-0 text-[10px] text-muted-foreground">
            {formatDataCurta(conversa.last_message_at ?? conversa.updated_at)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          {unread === 0 && <CheckCheck className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
          <p className="flex-1 truncate text-xs text-muted-foreground">
            {conversa.last_message_preview || 'Sem mensagens ainda'}
          </p>
          {unread > 0 && (
            <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread}
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
  isAdmin,
  onBack,
}: {
  conversa: CrmConversation;
  currentUserId: string;
  isAdmin: boolean;
  onBack: () => void;
}) {
  const [texto, setTexto] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: mensagens = [], sendMessage } = useRealtimeConversation(conversa.id);
  const title = conversationTitle(conversa, isAdmin);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || sendMessage.isPending) return;
    const body = texto.trim();
    setTexto('');
    await sendMessage.mutateAsync({
      conversationId: conversa.id,
      tenantId: conversa.tenant_id,
      body,
      senderRole: isAdmin ? 'advogado' : 'client',
      visibleToClient: true,
      channel: conversa.channel,
    });
  }

  let lastDate = '';

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted lg:hidden"
          aria-label="Voltar para conversas"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">
          {title.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            {mensagens.length} mensage{mensagens.length !== 1 ? 'ns' : 'm'}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {mensagens.map((m) => {
          const minha = isMine(m, isAdmin, currentUserId);
          const dataLabel = formatDataCurta(m.created_at);
          const showDate = dataLabel !== lastDate;
          lastDate = dataLabel;

          return (
            <div key={m.id}>
              {showDate && (
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="px-2 text-[10px] text-muted-foreground">{dataLabel}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <div className={cn('flex', minha ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-3.5 py-2.5',
                    minha
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-muted text-foreground',
                  )}
                >
                  <p className="text-sm leading-relaxed">{m.body}</p>
                  <p className={cn('mt-1 text-right text-[10px]', minha ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                    {formatHora(m.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex flex-shrink-0 items-end gap-2 border-t border-border bg-background px-4 py-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Digite uma mensagem..."
          rows={1}
          className="min-h-[38px] flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm transition-colors focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!texto.trim() || sendMessage.isPending}
          className="flex-shrink-0 rounded-xl bg-primary p-2.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          aria-label="Enviar mensagem"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export default function MensagensClient({ isAdmin, currentUserId, tenantId }: Props) {
  const [search, setSearch] = useState('');
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);
  const { data: inbox = [], isLoading, error } = useRealtimeInbox({
    tenantId,
    search: isAdmin ? search : undefined,
  });

  const conversas = useMemo(() => {
    const scoped = isAdmin
      ? inbox
      : inbox.filter((item) => item.contact_user_id === currentUserId || item.channel === 'portal');
    return scoped.filter((item) => !item.archived_at);
  }, [currentUserId, inbox, isAdmin]);

  useEffect(() => {
    if (!conversaAtiva && conversas.length > 0 && !isAdmin) {
      setConversaAtiva(conversas[0].id);
    }
  }, [conversaAtiva, conversas, isAdmin]);

  const conversaAtual = conversaAtiva
    ? conversas.find((c) => c.id === conversaAtiva) ?? null
    : null;

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-border bg-background p-6">
        <EmptyState
          icon={MessageSquare}
          title="Workspace nao encontrado"
          description="A inbox juridica precisa de um workspace ativo para carregar as conversas."
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border bg-background">
      <div
        className={cn(
          'flex w-full flex-col border-r border-border bg-background lg:w-80 lg:flex-shrink-0',
          conversaAtual && 'hidden lg:flex lg:flex-col',
        )}
      >
        <div className="flex-shrink-0 border-b border-border px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm font-semibold">Mensagens</p>
            {conversas.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                {conversas.length}
              </span>
            )}
          </div>
          {isAdmin && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/50 py-1.5 pl-9 pr-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <div className="h-14 rounded-lg bg-muted/70" />
              <div className="h-14 rounded-lg bg-muted/50" />
              <div className="h-14 rounded-lg bg-muted/40" />
            </div>
          ) : error || conversas.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={error ? 'Inbox indisponivel' : 'Nenhuma conversa'}
              description={error ? 'Nao foi possivel carregar as conversas agora.' : 'As mensagens aparecerão aqui.'}
            />
          ) : (
            conversas.map((c) => (
              <ConversaItem
                key={c.id}
                conversa={c}
                ativa={conversaAtiva === c.id}
                isAdmin={isAdmin}
                onClick={() => setConversaAtiva(c.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col', !conversaAtual && 'hidden lg:flex')}>
        {conversaAtual ? (
          <ThreadView
            conversa={conversaAtual}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onBack={() => setConversaAtiva(null)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Selecione uma conversa"
              description="Escolha uma conversa na lista para visualizar e responder."
            />
          </div>
        )}
      </div>
    </div>
  );
}
