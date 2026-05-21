import { cn } from '@/lib/utils';

interface Props {
  status: string;
  labels: Record<string, string>;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  // WorkflowStatus
  pendente_envio: 'bg-gray-100 text-gray-600 border-gray-200',
  enviado: 'bg-blue-50 text-blue-700 border-blue-200',
  recebido: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  em_analise: 'bg-amber-50 text-amber-700 border-amber-200',
  pendente_correcao: 'bg-orange-50 text-orange-700 border-orange-200',
  aprovado: 'bg-green-50 text-green-700 border-green-200',
  rejeitado: 'bg-red-50 text-red-700 border-red-200',
  aguardando_assinatura: 'bg-purple-50 text-purple-700 border-purple-200',
  assinado: 'bg-teal-50 text-teal-700 border-teal-200',
  // Fase
  cadastro: 'bg-blue-50 text-blue-700 border-blue-200',
  analise: 'bg-purple-50 text-purple-700 border-purple-200',
  negociacao: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  concluido: 'bg-green-50 text-green-700 border-green-200',
  arquivado: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function StatusBadge({ status, labels, className }: Props) {
  const label = labels[status] ?? status;
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', style, className)}>
      {label}
    </span>
  );
}
