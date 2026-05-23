export type { Database, Tables, TablesInsert, TablesUpdate, WorkflowStatus, UserRole } from './database';

export interface AuthUser {
  id: string;
  email: string;
  role: import('./database').UserRole;
  isAdmin: boolean;
  workspaceId: string | null;
  nome?: string;
}

export interface WorkspaceContext {
  user: AuthUser | null;
  workspaceId: string | null;
  viewMode: 'cliente' | 'advogado' | 'admin';
}

export interface ClienteSummary {
  user_id: string;
  full_name: string;
  email: string;
  cpf: string;
  fase: string;
  onboarding_done: boolean;
  cnj_step_atual: number;
  n_credores: number | null;
  created_at: string;
}

export interface Documento {
  id: string;
  tipo: string;
  nome_arquivo: string | null;
  storage_path: string | null;
  workflow_status: import('./database').WorkflowStatus;
  admin_notes: string | null;
  direction: string;
  mime_type: string | null;
  file_size: number | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export const WORKFLOW_STATUS_LABELS: Record<import('./database').WorkflowStatus, string> = {
  pendente_envio: 'Pendente envio',
  enviado: 'Enviado',
  recebido: 'Recebido',
  em_analise: 'Em análise',
  pendente_correcao: 'Correção pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  aguardando_assinatura: 'Ag. assinatura',
  assinado: 'Assinado',
  arquivado: 'Arquivado',
};

export const FASE_LABELS: Record<string, string> = {
  cadastro: 'Cadastro',
  analise: 'Análise',
  negociacao: 'Negociação',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
};
