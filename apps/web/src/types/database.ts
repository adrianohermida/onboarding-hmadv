export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type WorkflowStatus =
  | 'pendente_envio'
  | 'enviado'
  | 'recebido'
  | 'em_analise'
  | 'pendente_correcao'
  | 'aprovado'
  | 'rejeitado'
  | 'aguardando_assinatura'
  | 'assinado'
  | 'arquivado';

export type UserRole = 'master_admin' | 'tenant_admin' | 'advogado' | 'colaborador' | 'cliente';

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
      };
      admin_users: {
        Row: { user_id: string; role: string; created_at: string };
        Insert: { user_id: string; role?: string; created_at?: string };
        Update: { user_id?: string; role?: string };
      };
      portal_workspaces: {
        Row: {
          id: string;
          slug: string;
          name: string;
          owner_id: string | null;
          plan: string;
          status: string;
          settings: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['portal_workspaces']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['portal_workspaces']['Insert']>;
      };
      portal_casos: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          nome: string | null;
          cpf: string | null;
          rg: string | null;
          email: string | null;
          telefone: string | null;
          endereco: string | null;
          estado_civil: string | null;
          profissao: string | null;
          situacao_profissional: string | null;
          renda_mensal: number | null;
          renda_familiar: number | null;
          numero_dependentes: number | null;
          despesas: Json;
          patrimonio: Json;
          dividas: Json;
          causas_endividamento: Json;
          credores_cnj: Json;
          comprometimento_mensal: number | null;
          plano_pagamento: Json;
          cnj_json: Json;
          cnj_step_atual: number;
          onboarding_done: boolean;
          fase: string;
          status: string;
          fd_ticket_id: number | null;
          responsible_user_id: string | null;
          tags: string[];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['portal_casos']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['portal_casos']['Row']>;
      };
      portal_documentos: {
        Row: {
          id: string;
          user_id: string;
          workspace_id: string | null;
          caso_id: string | null;
          tipo: string;
          nome: string | null;
          url: string | null;
          storage_path: string | null;
          workflow_status: WorkflowStatus;
          category: string | null;
          admin_notes: string | null;
          observacao: string | null;
          observacao_admin: string | null;
          direction: string;
          require_signature: boolean;
          autentique_id: string | null;
          autentique_status: string | null;
          signed_file_url: string | null;
          version: number;
          file_size: number | null;
          mime_type: string | null;
          tags: string[];
          uploaded_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['portal_documentos']['Row']> & {
          user_id: string;
          tipo: string;
        };
        Update: Partial<Database['public']['Tables']['portal_documentos']['Row']>;
      };
      portal_timeline: {
        Row: {
          id: string;
          user_id: string;
          caso_id: string | null;
          event_type: string;
          title: string | null;
          description: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['portal_timeline']['Row']> & {
          user_id: string;
          event_type: string;
        };
        Update: never;
      };
      portal_workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: UserRole;
          invited_by: string | null;
          joined_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['portal_workspace_members']['Row']> & {
          workspace_id: string;
          user_id: string;
          role: UserRole;
        };
        Update: Partial<Database['public']['Tables']['portal_workspace_members']['Row']>;
      };
    };
    Views: {
      [key: string]: {
        Row: any;
      };
    };
    Functions: {
      [key: string]: { Args: any; Returns: any };
      is_any_admin: { Args: Record<string, never>; Returns: boolean };
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      admin_get_clients: {
        Args: { p_workspace_id?: string; p_search?: string; p_limit?: number; p_offset?: number };
        Returns: Array<{
          user_id: string;
          nome: string;
          email: string;
          telefone: string;
          cpf: string;
          fase: string;
          status: string;
          onboarding_done: boolean;
          created_at: string;
        }>;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
