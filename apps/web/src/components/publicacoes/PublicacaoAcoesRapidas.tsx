'use client';

import { useState } from 'react';
import {
  CheckSquare, Calendar, Users, Clock, Link2,
  AlertTriangle, CheckCircle2, StickyNote, ChevronDown, X, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicacaoDetalhe, NovaTarefa, NovaAudiencia } from './types';
import {
  useMarcarLida, useMarcarUrgente, useArquivar,
  useCriarAudiencia, useCriarTarefaLocal, useCriarPrazo,
} from '@/lib/hooks/use-publicacoes';

type AcaoAtiva = 'tarefa' | 'audiencia' | 'reuniao' | 'prazo' | null;

interface Props {
  publicacao: PublicacaoDetalhe;
  onRefresh: () => void;
}

function FormTarefa({
  publicacao,
  onSuccess,
}: {
  publicacao: PublicacaoDetalhe;
  onSuccess: () => void;
}) {
  const { mutateAsync, isPending } = useCriarTarefaLocal();
  const [dados, setDados] = useState<NovaTarefa>({
    titulo: publicacao.ai_tipo_ato
      ? `${publicacao.ai_tipo_ato} — ${publicacao.processos?.numero_cnj ?? publicacao.numero_processo_api ?? ''}`
      : `Verificar publicação — ${publicacao.processos?.numero_cnj ?? publicacao.numero_processo_api ?? ''}`,
    descricao: publicacao.ai_resumo ?? '',
    due_date: publicacao.prazo_calculado?.[0]?.data_vencimento?.split('T')[0] ?? '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await mutateAsync({
        dados,
        processoId: publicacao.processo_id,
        publicacaoId: publicacao.id,
      });
      onSuccess();
    } catch {
      alert('Erro ao criar tarefa. Verifique a configuração do schema judiciário.');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Título *</label>
        <input
          required
          value={dados.titulo}
          onChange={(e) => setDados({ ...dados, titulo: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição</label>
        <textarea
          rows={3}
          value={dados.descricao}
          onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Prazo</label>
        <input
          type="date"
          value={dados.due_date}
          onChange={(e) => setDados({ ...dados, due_date: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
        {isPending ? 'Criando...' : 'Criar Tarefa'}
      </button>
    </form>
  );
}

function FormAudiencia({
  publicacao,
  onSuccess,
}: {
  publicacao: PublicacaoDetalhe;
  onSuccess: () => void;
}) {
  const { mutateAsync, isPending } = useCriarAudiencia();
  const [dados, setDados] = useState<NovaAudiencia>({
    tipo: 'Audiência de instrução',
    data_audiencia: '',
    descricao: publicacao.ai_resumo ?? '',
    local: '',
    situacao: 'detectada',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicacao.processo_id) {
      alert('Esta publicação não possui processo vinculado.');
      return;
    }
    try {
      await mutateAsync({
        processoId: publicacao.processo_id,
        publicacaoId: publicacao.id,
        dados,
      });
      onSuccess();
    } catch {
      alert('Erro ao criar audiência.');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de audiência</label>
        <select
          value={dados.tipo}
          onChange={(e) => setDados({ ...dados, tipo: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {['Audiência de instrução', 'Audiência de conciliação', 'Audiência de julgamento', 'Audiência virtual', 'Audiência Una'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Data e hora</label>
        <input
          type="datetime-local"
          value={dados.data_audiencia}
          onChange={(e) => setDados({ ...dados, data_audiencia: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Local</label>
        <input
          value={dados.local}
          onChange={(e) => setDados({ ...dados, local: e.target.value })}
          placeholder={publicacao.cidade_comarca_descricao ?? ''}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Situação</label>
        <select
          value={dados.situacao}
          onChange={(e) => setDados({ ...dados, situacao: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {['detectada', 'confirmada', 'realizada', 'redesignada', 'cancelada'].map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Observações</label>
        <textarea
          rows={2}
          value={dados.descricao}
          onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || !publicacao.processo_id}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
        {isPending ? 'Criando...' : 'Criar Audiência'}
      </button>
      {!publicacao.processo_id && (
        <p className="text-xs text-amber-600">Vincule um processo antes de criar audiência.</p>
      )}
    </form>
  );
}

function FormPrazo({ publicacao, onSuccess }: { publicacao: PublicacaoDetalhe; onSuccess: () => void }) {
  const { mutateAsync, isPending } = useCriarPrazo();
  const dataBase = publicacao.data_publicacao?.split('T')[0] ?? new Date().toISOString().split('T')[0];
  const defaultVenc = (() => {
    if (publicacao.ai_prazo_sugerido) {
      const d = new Date(dataBase);
      d.setDate(d.getDate() + publicacao.ai_prazo_sugerido);
      return d.toISOString().split('T')[0];
    }
    return '';
  })();

  const [titulo, setTitulo] = useState(
    publicacao.ai_tipo_ato
      ? `Prazo — ${publicacao.ai_tipo_ato}`
      : `Prazo — ${publicacao.processos?.numero_cnj ?? 'Publicação'}`,
  );
  const [vencimento, setVencimento] = useState(defaultVenc);
  const [inicioContagem, setInicioContagem] = useState(dataBase);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicacao.processo_id) {
      alert('Vincule um processo antes de gerar prazo.');
      return;
    }
    try {
      await mutateAsync({
        processoId: publicacao.processo_id,
        publicacaoId: publicacao.id,
        titulo,
        dataBase,
        dataInicioContagem: inicioContagem,
        dataVencimento: vencimento,
      });
      onSuccess();
    } catch {
      alert('Erro ao gerar prazo.');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Título do prazo *</label>
        <input
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Início contagem</label>
          <input
            type="date"
            required
            value={inicioContagem}
            onChange={(e) => setInicioContagem(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Vencimento *</label>
          <input
            type="date"
            required
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending || !publicacao.processo_id}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-60 transition-colors"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
        {isPending ? 'Gerando...' : 'Gerar Prazo'}
      </button>
    </form>
  );
}

interface AcaoButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ativo: boolean;
  onClick: () => void;
  variant?: 'default' | 'green' | 'red' | 'amber';
}

function AcaoButton({ icon: Icon, label, ativo, onClick, variant = 'default' }: AcaoButtonProps) {
  const variantClass = {
    default: ativo ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:bg-muted/40',
    green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
    red: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
  }[variant];

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
        variantClass,
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
      {variant === 'default' && <ChevronDown className={cn('h-3.5 w-3.5 ml-auto transition-transform', ativo && 'rotate-180')} />}
    </button>
  );
}

export default function PublicacaoAcoesRapidas({ publicacao, onRefresh }: Props) {
  const [acaoAtiva, setAcaoAtiva] = useState<AcaoAtiva>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { mutate: marcarLida, isPending: marcandoLida } = useMarcarLida();
  const { mutate: marcarUrgente, isPending: marcandoUrgente } = useMarcarUrgente();
  const { mutate: arquivar, isPending: arquivando } = useArquivar();

  function toggle(acao: AcaoAtiva) {
    setAcaoAtiva(acaoAtiva === acao ? null : acao);
    setSuccessMsg(null);
  }

  function handleSuccess(msg: string) {
    setSuccessMsg(msg);
    setAcaoAtiva(null);
    onRefresh();
  }

  return (
    <div className="space-y-2">
      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Quick actions grid */}
      <div className="grid grid-cols-2 gap-1.5">
        <AcaoButton
          icon={CheckSquare}
          label="Criar tarefa"
          ativo={acaoAtiva === 'tarefa'}
          onClick={() => toggle('tarefa')}
        />
        <AcaoButton
          icon={Calendar}
          label="Criar audiência"
          ativo={acaoAtiva === 'audiencia'}
          onClick={() => toggle('audiencia')}
        />
        <AcaoButton
          icon={Users}
          label="Criar reunião"
          ativo={acaoAtiva === 'reuniao'}
          onClick={() => toggle('reuniao')}
        />
        <AcaoButton
          icon={Clock}
          label="Gerar prazo"
          ativo={acaoAtiva === 'prazo'}
          onClick={() => toggle('prazo')}
        />
      </div>

      {/* Inline forms */}
      {acaoAtiva === 'tarefa' && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Nova Tarefa</p>
            <button onClick={() => setAcaoAtiva(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <FormTarefa
            publicacao={publicacao}
            onSuccess={() => handleSuccess('Tarefa criada com sucesso!')}
          />
        </div>
      )}

      {acaoAtiva === 'audiencia' && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Nova Audiência</p>
            <button onClick={() => setAcaoAtiva(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <FormAudiencia
            publicacao={publicacao}
            onSuccess={() => handleSuccess('Audiência criada com sucesso!')}
          />
        </div>
      )}

      {acaoAtiva === 'reuniao' && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Nova Reunião</p>
            <button onClick={() => setAcaoAtiva(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <FormTarefa
            publicacao={{ ...publicacao, ai_tipo_ato: 'Reunião' }}
            onSuccess={() => handleSuccess('Reunião agendada!')}
          />
        </div>
      )}

      {acaoAtiva === 'prazo' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Gerar Prazo</p>
            <button onClick={() => setAcaoAtiva(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <FormPrazo
            publicacao={publicacao}
            onSuccess={() => handleSuccess('Prazo gerado com sucesso!')}
          />
        </div>
      )}

      {/* Secondary actions */}
      <div className="border-t border-border pt-2 flex flex-wrap gap-1.5">
        {!publicacao.lido && (
          <button
            onClick={() => marcarLida(publicacao.id, { onSuccess: onRefresh })}
            disabled={marcandoLida}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 disabled:opacity-60 transition-colors"
          >
            {marcandoLida ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Marcar como lida
          </button>
        )}

        {publicacao.ai_urgencia !== 'urgente' && (
          <button
            onClick={() => marcarUrgente({ id: publicacao.id, urgencia: 'urgente' }, { onSuccess: onRefresh })}
            disabled={marcandoUrgente}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 text-xs font-medium hover:bg-orange-100 disabled:opacity-60 transition-colors"
          >
            {marcandoUrgente ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
            Marcar urgente
          </button>
        )}

        <button
          onClick={() => arquivar(publicacao.id, { onSuccess: onRefresh })}
          disabled={arquivando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-medium hover:bg-muted/40 disabled:opacity-60 transition-colors"
        >
          {arquivando ? <Loader2 className="h-3 w-3 animate-spin" /> : <StickyNote className="h-3 w-3" />}
          Arquivar
        </button>

        {!publicacao.processo_id && (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <Link2 className="h-3 w-3" />
            Vincular processo
          </button>
        )}
      </div>
    </div>
  );
}
