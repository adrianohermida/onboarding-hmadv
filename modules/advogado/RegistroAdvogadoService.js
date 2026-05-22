const STORAGE_PREFIX = 'portal:advogado:registros:';
const TIMELINE_PREFIX = 'portal:advogado:timeline:';
const AUDIT_PREFIX = 'portal:advogado:audit:';
const OPERATIONAL_TABLE = 'portal_operational_records';
const AUDIT_TABLE = 'portal_operational_record_audit';
const PARTES_LINKS_TABLE = 'portal_partes_vinculos';

const MODULE_DATA_SOURCES = {
  documentos: { schema: 'public', table: 'portal_documentos', statusField: 'workflow_status' },
  planos: { schema: 'public', table: 'portal_planos_pagamento' },
  processos: { schema: 'judiciario', table: 'processos' },
  movimentacoes: { schema: 'judiciario', table: 'movimentacoes' },
  publicacoes: { schema: 'judiciario', table: 'publicacoes' },
  audiencias: { schema: 'judiciario', table: 'audiencias' },
  prazos: { schema: 'judiciario', table: 'prazo_tarefa' },
  'financeiro-processual': { schema: 'judiciario', table: 'financeiro_processual', statusField: 'situacao' },
  'custas-processuais': { schema: 'judiciario', table: 'custas_processuais', statusField: 'situacao' },
  tpu: { schema: 'judiciario', table: 'tpu' },
  'orgaos-judiciarios': { schema: 'judiciario', table: 'orgaos_judiciarios', statusField: 'ativa' },
  serventias: { schema: 'judiciario', table: 'serventias', statusField: 'ativa' },
  'relacoes-processuais': { schema: 'judiciario', table: 'relacoes_processuais' },
};

let supabaseClientPromise = null;
let currentWorkspacePromise = null;

async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import('../../services/supabase.js').then(module => module.supabase);
  }
  return supabaseClientPromise;
}

const BOOLEAN_OPTIONS = ['true', 'false'];

const PROCESSOS_STATUS = [
  'ativo',
  'monitoramento',
  'em_andamento',
  'suspenso',
  'arquivado',
  'baixado',
  'encerrado',
  'erro_sync',
];

const PARTES_STATUS = [
  'ativa',
  'pendente_vinculo',
  'vinculada',
  'representada',
  'inativa',
  'arquivada',
];

const AUDIENCIAS_STATUS = [
  'detectada',
  'agendada',
  'confirmada',
  'realizada',
  'remarcada',
  'cancelada',
  'nao_comparecimento',
  'arquivada',
];

const PUBLICACOES_STATUS = [
  'pending',
  'queued',
  'synced',
  'error',
  'manual_review',
  'arquivada',
];

const PROCESSOS_FIELDS = [
  { key: 'tenant_id', label: 'Tenant ID', type: 'text' },
  { key: 'numero_cnj', label: 'Numero CNJ', type: 'text', required: true },
  { key: 'numero_processo', label: 'Numero do processo', type: 'text' },
  { key: 'titulo', label: 'Titulo', type: 'text' },
  { key: 'classe', label: 'Classe', type: 'text' },
  { key: 'assunto', label: 'Assunto', type: 'text' },
  { key: 'assunto_principal', label: 'Assunto principal', type: 'text' },
  { key: 'orgao_julgador', label: 'Orgao julgador', type: 'text' },
  { key: 'julgador', label: 'Julgador', type: 'text' },
  { key: 'tribunal', label: 'Tribunal', type: 'text' },
  { key: 'ramo', label: 'Ramo', type: 'text' },
  { key: 'comarca', label: 'Comarca', type: 'text' },
  { key: 'grau', label: 'Grau', type: 'number' },
  { key: 'instancia', label: 'Instancia', type: 'text' },
  { key: 'tipo_acao', label: 'Tipo de acao', type: 'text' },
  { key: 'tipo_processo_geral', label: 'Tipo de processo geral', type: 'text' },
  { key: 'status_atual_processo', label: 'Status atual do processo', type: 'text' },
  { key: 'prioridade', label: 'Prioridade', type: 'select', options: ['baixa', 'media', 'alta', 'critica'] },
  { key: 'polo_ativo', label: 'Polo ativo', type: 'text' },
  { key: 'polo_passivo', label: 'Polo passivo', type: 'text' },
  { key: 'outras_partes', label: 'Outras partes', type: 'textarea' },
  { key: 'valor_causa', label: 'Valor da causa', type: 'number' },
  { key: 'segredo_justica', label: 'Segredo de justica', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'arquivado', label: 'Arquivado', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'data_ajuizamento', label: 'Data de ajuizamento', type: 'date' },
  { key: 'data_distribuicao', label: 'Data de distribuicao', type: 'date' },
  { key: 'data_ultima_movimentacao', label: 'Data ultima movimentacao', type: 'date' },
  { key: 'data_ultimo_movimento', label: 'Data ultimo movimento', type: 'date' },
  { key: 'ultimo_movimento_em', label: 'Ultimo movimento em', type: 'datetime-local' },
  { key: 'data_ultima_atualizacao_externa', label: 'Ultima atualizacao externa', type: 'datetime-local' },
  { key: 'sistema', label: 'Sistema', type: 'text' },
  { key: 'area', label: 'Area', type: 'text' },
  { key: 'link_externo_processo', label: 'Link externo', type: 'text' },
  { key: 'monitorado_escavador', label: 'Monitorado escavador', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'observacoes', label: 'Observacoes', type: 'textarea' },
  { key: 'cliente_id', label: 'Cliente ID', type: 'text' },
  { key: 'advogado_responsavel_id', label: 'Advogado responsavel ID', type: 'text' },
  { key: 'escritorio_id', label: 'Escritorio ID', type: 'text' },
  { key: 'created_by_id', label: 'Criado por ID', type: 'text' },
  { key: 'created_by', label: 'Criado por', type: 'text' },
  { key: 'is_sample', label: 'Amostra', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'classe_codigo', label: 'Codigo da classe', type: 'number' },
  { key: 'sistema_codigo', label: 'Codigo do sistema', type: 'number' },
  { key: 'orgao_julgador_codigo', label: 'Codigo orgao julgador', type: 'number' },
  { key: 'formato', label: 'Formato', type: 'text' },
  { key: 'account_id_freshsales', label: 'Account ID Freshsales', type: 'text' },
  { key: 'dados_incompletos', label: 'Dados incompletos', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'fonte_criacao', label: 'Fonte de criacao', type: 'text' },
  { key: 'classe_id', label: 'Classe TPU ID', type: 'text' },
  { key: 'assunto_principal_id', label: 'Assunto principal TPU ID', type: 'text' },
  { key: 'assunto_ids', label: 'Assunto IDs (JSON array)', type: 'textarea' },
  { key: 'orgao_julgador_tpu_id', label: 'Orgao julgador TPU ID', type: 'text' },
  { key: 'parte_representada_adriano', label: 'Parte representada pelo escritorio', type: 'text' },
  { key: 'fs_sync_at', label: 'Freshsales sync em', type: 'datetime-local' },
  { key: 'fs_sync_hash', label: 'Freshsales sync hash', type: 'text' },
  { key: 'datajud_status', label: 'Status Datajud', type: 'text' },
  { key: 'datajud_last_attempt_at', label: 'Datajud ultima tentativa', type: 'datetime-local' },
  { key: 'datajud_last_success_at', label: 'Datajud ultimo sucesso', type: 'datetime-local' },
  { key: 'datajud_last_error', label: 'Datajud ultimo erro', type: 'textarea' },
  { key: 'datajud_nao_enriquecivel', label: 'Datajud nao enriquecivel', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'datajud_payload_hash', label: 'Datajud payload hash', type: 'text' },
  { key: 'serventia_cnj_id', label: 'Serventia CNJ ID', type: 'text' },
  { key: 'juizo_cnj_id', label: 'Juizo CNJ ID', type: 'text' },
  { key: 'codigo_foro_local', label: 'Codigo foro local', type: 'text' },
  { key: 'parser_tribunal_schema', label: 'Parser tribunal schema', type: 'text' },
  { key: 'parser_grau', label: 'Parser grau', type: 'text' },
  { key: 'parser_sistema', label: 'Parser sistema', type: 'text' },
  { key: 'status_fonte', label: 'Status fonte', type: 'text' },
  { key: 'status_detectado_em', label: 'Status detectado em', type: 'datetime-local' },
  { key: 'status_evento_origem', label: 'Status evento origem', type: 'text' },
  { key: 'monitoramento_ativo', label: 'Monitoramento ativo', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'fs_tag_leilao_aplicada', label: 'FS tag leilao aplicada em', type: 'datetime-local' },
  { key: 'freshsales_synced_at', label: 'Freshsales synced at', type: 'datetime-local' },
];

const PARTES_FIELDS = [
  { key: 'processo_id', label: 'Processo ID', type: 'text', required: true },
  { key: 'plano_pagamento_id', label: 'Plano pagamento ID', type: 'text' },
  { key: 'cliente_user_id', label: 'Cliente user ID', type: 'text' },
  { key: 'caso_id', label: 'Caso ID', type: 'text' },
  { key: 'vinculo_status', label: 'Vinculo', type: 'select', options: ['ativo', 'inativo'], required: true },
  { key: 'tenant_id', label: 'Tenant ID', type: 'text' },
  { key: 'nome', label: 'Nome', type: 'text', required: true },
  { key: 'tipo', label: 'Tipo', type: 'text' },
  { key: 'polo', label: 'Polo', type: 'select', options: ['ativo', 'passivo', 'terceiro', 'neutro'] },
  { key: 'documento', label: 'Documento', type: 'text' },
  { key: 'contact_id_freshsales', label: 'Contact ID Freshsales', type: 'text' },
  { key: 'tipo_pessoa', label: 'Tipo pessoa', type: 'select', options: ['FISICA', 'JURIDICA', 'indefinido'] },
  { key: 'advogados', label: 'Advogados (JSON)', type: 'textarea' },
  { key: 'fonte', label: 'Fonte', type: 'text' },
  { key: 'representada_pelo_escritorio', label: 'Representada pelo escritorio', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'cliente_hmadv', label: 'Cliente HMADV', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'contato_freshsales_id', label: 'Contato Freshsales ID', type: 'text' },
  { key: 'principal_no_account', label: 'Principal no account', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'observacao', label: 'Observacao operacional', type: 'textarea' },
];

const AUDIENCIAS_FIELDS = [
  { key: 'processo_id', label: 'Processo ID', type: 'text', required: true },
  { key: 'origem', label: 'Origem', type: 'select', options: ['DATAJUD', 'PUBLICACAO', 'MANUAL', 'INTEGRACAO'], required: true },
  { key: 'origem_id', label: 'Origem ID', type: 'text' },
  { key: 'tipo', label: 'Tipo', type: 'select', options: ['conciliacao', 'instrucao', 'julgamento', 'virtual', 'saneamento', 'outra'] },
  { key: 'data_audiencia', label: 'Data da audiencia', type: 'datetime-local' },
  { key: 'descricao', label: 'Descricao', type: 'textarea' },
  { key: 'local', label: 'Local', type: 'text' },
  { key: 'situacao', label: 'Situacao', type: 'select', options: AUDIENCIAS_STATUS },
  { key: 'metadata', label: 'Metadata (JSON)', type: 'textarea' },
  { key: 'freshsales_activity_id', label: 'Freshsales activity ID', type: 'text' },
];

const PUBLICACOES_FIELDS = [
  { key: 'processo_id', label: 'Processo ID', type: 'text' },
  { key: 'data_publicacao', label: 'Data da publicacao', type: 'datetime-local' },
  { key: 'conteudo', label: 'Conteudo', type: 'textarea' },
  { key: 'tem_prazo', label: 'Tem prazo', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'prazo_data', label: 'Data do prazo', type: 'datetime-local' },
  { key: 'advise_id_publicacao_cliente', label: 'Advise ID publicacao cliente', type: 'number' },
  { key: 'advise_id_publicacao', label: 'Advise ID publicacao', type: 'number' },
  { key: 'advise_id_mov_usuario_cliente', label: 'Advise ID mov usuario cliente', type: 'number' },
  { key: 'advise_id_cliente', label: 'Advise ID cliente', type: 'number' },
  { key: 'advise_id_usuario_cliente', label: 'Advise ID usuario cliente', type: 'number' },
  { key: 'advise_cod_publicacao', label: 'Advise cod publicacao', type: 'number' },
  { key: 'advise_cod_diario', label: 'Advise cod diario', type: 'number' },
  { key: 'advise_cod_caderno', label: 'Advise cod caderno', type: 'number' },
  { key: 'advise_id_municipio', label: 'Advise ID municipio', type: 'number' },
  { key: 'advise_id_caderno_diario_edicao', label: 'Advise ID caderno diario edicao', type: 'number' },
  { key: 'data_hora_movimento', label: 'Data hora movimento', type: 'datetime-local' },
  { key: 'data_hora_cadastro', label: 'Data hora cadastro', type: 'datetime-local' },
  { key: 'ativo', label: 'Ativo', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'ativo_publicacao', label: 'Ativo publicacao', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'ano_publicacao', label: 'Ano publicacao', type: 'number' },
  { key: 'edicao_diario', label: 'Edicao diario', type: 'number' },
  { key: 'cidade_comarca_descricao', label: 'Cidade/comarca', type: 'text' },
  { key: 'vara_descricao', label: 'Vara descricao', type: 'text' },
  { key: 'pagina_inicial_publicacao', label: 'Pagina inicial', type: 'number' },
  { key: 'pagina_final_publicacao', label: 'Pagina final', type: 'number' },
  { key: 'despacho', label: 'Despacho', type: 'textarea' },
  { key: 'corrigido', label: 'Corrigido', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'lido', label: 'Lido', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'nome_diario', label: 'Nome diario', type: 'text' },
  { key: 'descricao_diario', label: 'Descricao diario', type: 'text' },
  { key: 'nome_caderno_diario', label: 'Nome caderno diario', type: 'text' },
  { key: 'descricao_caderno_diario', label: 'Descricao caderno diario', type: 'text' },
  { key: 'nome_cliente', label: 'Nome cliente', type: 'text' },
  { key: 'nome_usuario_cliente', label: 'Nome usuario cliente', type: 'text' },
  { key: 'numero_processo_api', label: 'Numero processo API', type: 'text', required: true },
  { key: 'raw_payload', label: 'Raw payload (JSON)', type: 'textarea' },
  { key: 'freshsales_activity_id', label: 'Freshsales activity ID', type: 'text' },
  { key: 'freshsales_task_id', label: 'Freshsales task ID', type: 'text' },
  { key: 'adriano_polo', label: 'Polo Adriano', type: 'select', options: ['ativo', 'passivo', 'nao_identificado'] },
  { key: 'processual', label: 'Processual', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'tipo_documento', label: 'Tipo documento', type: 'text' },
  { key: 'motivo_sem_processo', label: 'Motivo sem processo', type: 'textarea' },
  { key: 'triagem_manual', label: 'Triagem manual', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'ai_resumo', label: 'AI resumo', type: 'textarea' },
  { key: 'ai_tipo_ato', label: 'AI tipo ato', type: 'text' },
  { key: 'ai_prazo_sugerido', label: 'AI prazo sugerido (dias)', type: 'number' },
  { key: 'ai_urgencia', label: 'AI urgencia', type: 'select', options: ['baixa', 'normal', 'alta', 'critica'] },
  { key: 'ai_enriquecido_at', label: 'AI enriquecido em', type: 'datetime-local' },
  { key: 'ai_tokens_usados', label: 'AI tokens usados', type: 'number' },
  { key: 'freshsales_synced_at', label: 'Freshsales synced at', type: 'datetime-local' },
  { key: 'fs_sync_status', label: 'FS sync status', type: 'select', options: PUBLICACOES_STATUS },
  { key: 'fs_sync_error', label: 'FS sync erro', type: 'textarea' },
  { key: 'fs_sync_retries', label: 'FS sync retries', type: 'number' },
  { key: 'fs_sync_next_retry', label: 'FS sync proxima tentativa', type: 'datetime-local' },
];

const MOVIMENTACOES_STATUS = [
  'nova',
  'classificada',
  'com_prazo',
  'sincronizada',
  'arquivada',
];

const PRAZOS_STATUS = [
  'aberto',
  'em_andamento',
  'suspenso',
  'concluido',
  'vencido',
  'arquivado',
];

const FINANCEIRO_PROCESSUAL_STATUS = [
  'pago',
  'pendente',
  'vencido',
  'parcelado',
  'arquivado',
];

const CUSTAS_PROCESSUAIS_STATUS = [
  'pendente',
  'emitida',
  'paga',
  'vencida',
  'parcelada',
  'arquivada',
];

const TPU_STATUS = [
  'ativo',
  'importado',
  'atualizado',
  'pendente_sync',
  'arquivado',
];

const ORGAOS_JUDICIARIOS_STATUS = [
  'ativo',
  'em_revisao',
  'homologado',
  'inativo',
  'arquivado',
];

const SERVENTIAS_STATUS = [
  'ativa',
  'em_validacao',
  'homologada',
  'inativa',
  'arquivada',
];

const RELACOES_PROCESSUAIS_STATUS = [
  'ativo',
  'em_analise',
  'vinculado',
  'inativo',
  'arquivado',
];

const MOVIMENTACOES_FIELDS = [
  { key: 'processo_id', label: 'Processo ID', type: 'text', required: true },
  { key: 'fonte', label: 'Fonte', type: 'select', options: ['DATAJUD', 'TRIBUNAL', 'PUBLICACAO', 'MANUAL'] },
  { key: 'data_movimentacao', label: 'Data movimentacao', type: 'datetime-local' },
  { key: 'conteudo', label: 'Conteudo', type: 'textarea', required: true },
  { key: 'hash_integridade', label: 'Hash integridade', type: 'text' },
  { key: 'movimento_tpu_id', label: 'Movimento TPU ID', type: 'text' },
  { key: 'codigo', label: 'Codigo movimento', type: 'number' },
  { key: 'descricao', label: 'Descricao movimento', type: 'text' },
  { key: 'data_movimento', label: 'Data movimento', type: 'datetime-local' },
  { key: 'data_andamento', label: 'Data andamento', type: 'datetime-local' },
  { key: 'tipo_movimento_id', label: 'Tipo movimento ID', type: 'number' },
  { key: 'tipo_movimento_nome', label: 'Tipo movimento nome', type: 'text' },
  { key: 'complemento', label: 'Complemento', type: 'textarea' },
  { key: 'freshsales_activity_id', label: 'Freshsales activity ID', type: 'text' },
  { key: 'fs_activity_id', label: 'FS activity legacy ID', type: 'text' },
  { key: 'fs_synced_at', label: 'FS synced at', type: 'datetime-local' },
  { key: 'tpu_status', label: 'Status TPU', type: 'text' },
  { key: 'tpu_resolvido_em', label: 'TPU resolvido em', type: 'datetime-local' },
  { key: 'raw_payload', label: 'Raw payload (JSON)', type: 'textarea' },
  { key: 'observacao', label: 'Observacao operacional', type: 'textarea' },
];

const PRAZOS_FIELDS = [
  { key: 'processo_id', label: 'Processo ID', type: 'text', required: true },
  { key: 'publicacao_id', label: 'Publicacao ID', type: 'text' },
  { key: 'movimento_id', label: 'Movimento ID', type: 'text' },
  { key: 'audiencia_id', label: 'Audiencia ID', type: 'text' },
  { key: 'prazo_regra_id', label: 'Prazo regra ID', type: 'text' },
  { key: 'evento_tipo', label: 'Evento tipo', type: 'text', required: true },
  { key: 'titulo', label: 'Titulo', type: 'text', required: true },
  { key: 'data_base', label: 'Data base', type: 'date', required: true },
  { key: 'data_inicio_contagem', label: 'Data inicio contagem', type: 'date', required: true },
  { key: 'data_vencimento', label: 'Data vencimento', type: 'date', required: true },
  { key: 'status', label: 'Status', type: 'select', options: PRAZOS_STATUS },
  { key: 'prioridade', label: 'Prioridade', type: 'select', options: ['baixa', 'media', 'alta', 'critica'] },
  { key: 'observacoes_ia', label: 'Observacoes IA', type: 'textarea' },
  { key: 'freshsales_task_id', label: 'Freshsales task ID', type: 'text' },
  { key: 'google_event_id', label: 'Google event ID', type: 'text' },
  { key: 'google_calendar_id', label: 'Google calendar ID', type: 'text' },
  { key: 'metadata', label: 'Metadata (JSON)', type: 'textarea' },
  { key: 'ato_praticado', label: 'Ato praticado (regra)', type: 'text' },
  { key: 'base_legal', label: 'Base legal (regra)', type: 'text' },
  { key: 'prazo_dias', label: 'Prazo dias (regra)', type: 'number' },
  { key: 'tipo_contagem', label: 'Tipo contagem (regra)', type: 'select', options: ['dias_uteis', 'dias_corridos'] },
  { key: 'alias', label: 'Alias da regra', type: 'text' },
  { key: 'memoria_calculo', label: 'Memoria calculo (tarefa)', type: 'textarea' },
  { key: 'tipo_prazo', label: 'Tipo prazo (tarefa)', type: 'text' },
];

const FINANCEIRO_PROCESSUAL_FIELDS = [
  { key: 'processo_id', label: 'Processo ID', type: 'text', required: true },
  { key: 'data', label: 'Data', type: 'datetime-local', required: true },
  { key: 'descricao', label: 'Descricao', type: 'text', required: true },
  { key: 'categoria', label: 'Categoria', type: 'select', options: ['custa', 'despesa', 'honorario', 'guia', 'reembolso', 'outro'] },
  { key: 'centro_custo', label: 'Centro de custo', type: 'text' },
  { key: 'valor', label: 'Valor', type: 'number', required: true },
  { key: 'situacao', label: 'Situacao', type: 'select', options: FINANCEIRO_PROCESSUAL_STATUS },
  { key: 'criado_em', label: 'Criado em', type: 'datetime-local' },
  { key: 'observacao', label: 'Observacao', type: 'textarea' },
];

const CUSTAS_PROCESSUAIS_FIELDS = [
  { key: 'processo_id', label: 'Processo ID', type: 'text', required: true },
  { key: 'descricao', label: 'Descricao da custa', type: 'text', required: true },
  { key: 'categoria', label: 'Categoria', type: 'select', options: ['guia', 'taxa', 'emolumento', 'diligencia', 'deslocamento', 'outro'] },
  { key: 'valor', label: 'Valor', type: 'number', required: true },
  { key: 'data', label: 'Data de emissao', type: 'datetime-local' },
  { key: 'situacao', label: 'Situacao', type: 'select', options: CUSTAS_PROCESSUAIS_STATUS },
  { key: 'data_vencimento', label: 'Data vencimento', type: 'date' },
  { key: 'comprovante', label: 'Comprovante (URL/ID)', type: 'text' },
  { key: 'observacao', label: 'Observacao', type: 'textarea' },
];

const TPU_FIELDS = [
  { key: 'tipo_tpu', label: 'Tipo TPU', type: 'select', options: ['classe', 'assunto', 'movimento', 'documento', 'orgao'], required: true },
  { key: 'codigo_cnj', label: 'Codigo CNJ', type: 'number', required: true },
  { key: 'nome', label: 'Nome', type: 'text', required: true },
  { key: 'descricao', label: 'Descricao', type: 'textarea' },
  { key: 'sigla', label: 'Sigla', type: 'text' },
  { key: 'tipo', label: 'Tipo movimento', type: 'select', options: ['despacho', 'decisao', 'sentenca', 'acordao', 'intimacao', 'citacao', 'outro'] },
  { key: 'gera_prazo', label: 'Gera prazo', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'prazo_sugerido_dias', label: 'Prazo sugerido (dias)', type: 'number' },
  { key: 'area_direito', label: 'Area do direito', type: 'text' },
  { key: 'codigo_pai_cnj', label: 'Codigo pai CNJ', type: 'number' },
  { key: 'tribunal', label: 'Tribunal', type: 'text' },
  { key: 'municipio', label: 'Municipio', type: 'text' },
  { key: 'uf', label: 'UF', type: 'text' },
  { key: 'grau', label: 'Grau', type: 'text' },
  { key: 'ativa', label: 'Ativa', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'versao_cnj', label: 'Versao CNJ', type: 'number' },
  { key: 'gateway_synced_at', label: 'Gateway synced at', type: 'datetime-local' },
  { key: 'glossario', label: 'Glossario', type: 'textarea' },
  { key: 'gateway_payload', label: 'Gateway payload (JSON)', type: 'textarea' },
];

const ORGAOS_JUDICIARIOS_FIELDS = [
  { key: 'codigo_cnj', label: 'Codigo CNJ', type: 'number', required: true },
  { key: 'nome', label: 'Nome do orgao', type: 'text', required: true },
  { key: 'tribunal', label: 'Tribunal', type: 'text', required: true },
  { key: 'grau', label: 'Grau', type: 'text' },
  { key: 'orgao_julgador', label: 'Orgao julgador', type: 'text' },
  { key: 'especialidade', label: 'Especialidade', type: 'text' },
  { key: 'tipo', label: 'Tipo', type: 'text' },
  { key: 'municipio', label: 'Municipio', type: 'text' },
  { key: 'uf', label: 'UF', type: 'text' },
  { key: 'juizo_100_digital', label: 'Juizo 100% digital', type: 'select', options: BOOLEAN_OPTIONS },
  { key: 'competencia', label: 'Competencia', type: 'text' },
  { key: 'serventia_id', label: 'Serventia ID', type: 'text' },
  { key: 'metadata', label: 'Metadata (JSON)', type: 'textarea' },
  { key: 'ativa', label: 'Ativa', type: 'select', options: BOOLEAN_OPTIONS },
];

const SERVENTIAS_FIELDS = [
  { key: 'tribunal', label: 'Tribunal', type: 'text', required: true },
  { key: 'nome_serventia', label: 'Nome da serventia', type: 'text', required: true },
  { key: 'numero_serventia', label: 'Numero serventia', type: 'text' },
  { key: 'tipo_orgao', label: 'Tipo orgao', type: 'text' },
  { key: 'competencia', label: 'Competencia', type: 'text' },
  { key: 'codigo_municipio_ibge', label: 'Codigo municipio IBGE', type: 'text' },
  { key: 'municipio', label: 'Municipio', type: 'text' },
  { key: 'uf', label: 'UF', type: 'text' },
  { key: 'endereco', label: 'Endereco', type: 'text' },
  { key: 'cep', label: 'CEP', type: 'text' },
  { key: 'telefone', label: 'Telefone', type: 'text' },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'horario_funcionamento', label: 'Horario funcionamento', type: 'text' },
  { key: 'origem', label: 'Origem', type: 'text' },
  { key: 'geolocalizacao', label: 'Geolocalizacao (JSON)', type: 'textarea' },
  { key: 'metadata', label: 'Metadata (JSON)', type: 'textarea' },
  { key: 'ativa', label: 'Ativa', type: 'select', options: BOOLEAN_OPTIONS },
];

const RELACOES_PROCESSUAIS_FIELDS = [
  { key: 'processo_pai_id', label: 'Processo pai ID', type: 'text', required: true },
  { key: 'processo_filho_id', label: 'Processo filho ID', type: 'text', required: true },
  { key: 'numero_cnj_pai', label: 'CNJ pai', type: 'text', required: true },
  { key: 'numero_cnj_filho', label: 'CNJ filho', type: 'text', required: true },
  { key: 'tipo_relacao', label: 'Tipo relacao', type: 'select', options: ['apenso', 'incidente', 'recurso', 'dependencia'], required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['ativo', 'inativo'] },
  { key: 'observacoes', label: 'Observacoes', type: 'textarea' },
  { key: 'grafo', label: 'Grafo relacional (JSON)', type: 'textarea' },
];

export const ADVOGADO_MODULES = {
  clientes: {
    title: 'Clientes',
    singular: 'cliente',
    description: 'Carteira operacional do escritório, com leitura dos clientes reais quando disponível.',
    primaryField: 'nome',
    status: ['ativo', 'em_onboarding', 'pendente', 'inativo', 'arquivado'],
    fields: [
      { key: 'tipo_pessoa', label: 'Tipo pessoa', type: 'select', options: ['PF', 'PJ'], required: true },
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'full_name', label: 'Nome completo (schema)', type: 'text' },
      { key: 'cpf', label: 'CPF', type: 'text' },
      { key: 'cnpj', label: 'CNPJ', type: 'text' },
      { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
      { key: 'telefone', label: 'Telefone', type: 'text' },
      { key: 'user_id', label: 'User ID', type: 'text' },
      { key: 'workspace_id', label: 'Workspace ID', type: 'text' },
      { key: 'fase', label: 'Fase', type: 'select', options: ['cadastro', 'documentos', 'negociação', 'processo', 'acompanhamento'] },
      { key: 'onboarding_done', label: 'Onboarding concluído', type: 'select', options: BOOLEAN_OPTIONS },
      { key: 'cnj_step_atual', label: 'Step CNJ atual', type: 'number' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'responsavel_id', label: 'Responsável ID', type: 'text' },
      { key: 'cidade', label: 'Cidade', type: 'text' },
      { key: 'estado', label: 'Estado', type: 'text' },
      { key: 'prazo', label: 'Prazo', type: 'date' },
      { key: 'metadata', label: 'Metadata (JSON)', type: 'textarea' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  partes: {
    title: 'Partes',
    singular: 'parte',
    description: 'Cobertura completa da tabela judiciario.partes para vinculação processual e CRM.',
    primaryField: 'nome',
    status: PARTES_STATUS,
    fields: PARTES_FIELDS,
  },
  planos: {
    title: 'Planos',
    singular: 'plano',
    description: 'Planos de pagamento, propostas e acordos vinculados aos casos.',
    primaryField: 'titulo',
    status: ['rascunho', 'em_revisao', 'enviado', 'aprovado', 'arquivado'],
    fields: [
      { key: 'titulo', label: 'Plano', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text', required: true },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'parcela_sugerida', label: 'Parcela sugerida', type: 'number' },
      { key: 'prazo_meses', label: 'Prazo em meses', type: 'number' },
      { key: 'prazo', label: 'Prazo', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  documentos: {
    title: 'Documentos',
    singular: 'documento',
    description: 'Controle operacional de documentos enviados, revisados e assinados.',
    primaryField: 'titulo',
    status: ['pendente_envio', 'em_analise', 'aprovado', 'aguardando_assinatura', 'arquivado'],
    fields: [
      { key: 'titulo', label: 'Documento', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'select', options: ['identidade', 'residência', 'financeiro', 'dívidas', 'contratos', 'assinatura'] },
      { key: 'prazo', label: 'Prazo', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  dividas: {
    title: 'Dívidas',
    singular: 'dívida',
    description: 'Controle operacional de credores, valores, status e tratativas.',
    primaryField: 'credor',
    status: ['informada', 'em_analise', 'negociacao', 'contestada', 'arquivada'],
    fields: [
      { key: 'credor', label: 'Credor', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text', required: true },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['cartão', 'empréstimo', 'cheque especial', 'financiamento', 'outros'] },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  processos: {
    title: 'Processos',
    singular: 'processo',
    description: 'Cobertura completa da tabela judiciario.processos com rastreio Datajud e Freshsales.',
    primaryField: 'numero_cnj',
    status: PROCESSOS_STATUS,
    fields: PROCESSOS_FIELDS,
  },
  audiencias: {
    title: 'Audiencias',
    singular: 'audiencia',
    description: 'Cobertura completa da tabela judiciario.audiencias para agenda processual e sync CRM.',
    primaryField: 'descricao',
    status: AUDIENCIAS_STATUS,
    fields: AUDIENCIAS_FIELDS,
  },
  publicacoes: {
    title: 'Publicacoes',
    singular: 'publicacao',
    description: 'Cobertura completa da tabela judiciario.publicacoes com triagem, IA e sync Freshsales.',
    primaryField: 'numero_processo_api',
    status: PUBLICACOES_STATUS,
    fields: PUBLICACOES_FIELDS,
  },
  movimentacoes: {
    title: 'Movimentacoes',
    singular: 'movimentacao',
    description: 'Timeline juridica unificada para movimentos, andamentos e sincronizacao processual.',
    primaryField: 'conteudo',
    status: MOVIMENTACOES_STATUS,
    fields: MOVIMENTACOES_FIELDS,
  },
  prazos: {
    title: 'Prazos',
    singular: 'prazo',
    description: 'Gestao completa de prazos calculados, regras, eventos e tarefas processuais.',
    primaryField: 'titulo',
    status: PRAZOS_STATUS,
    fields: PRAZOS_FIELDS,
  },
  'financeiro-processual': {
    title: 'Financeiro Processual',
    singular: 'lancamento',
    description: 'Controle financeiro do processo com custas, despesas, honorarios e situacao de pagamento.',
    primaryField: 'descricao',
    status: FINANCEIRO_PROCESSUAL_STATUS,
    fields: FINANCEIRO_PROCESSUAL_FIELDS,
  },
  'custas-processuais': {
    title: 'Custas',
    singular: 'custa',
    description: 'Operacao de custas judiciais, guias e comprovantes vinculados ao processo.',
    primaryField: 'descricao',
    status: CUSTAS_PROCESSUAIS_STATUS,
    fields: CUSTAS_PROCESSUAIS_FIELDS,
  },
  tpu: {
    title: 'TPU',
    singular: 'item tpu',
    description: 'Catalogo TPU CNJ para classes, assuntos, movimentos, documentos e orgaos.',
    primaryField: 'nome',
    status: TPU_STATUS,
    fields: TPU_FIELDS,
  },
  'orgaos-judiciarios': {
    title: 'Orgaos Judiciarios',
    singular: 'orgao',
    description: 'Cadastro e consulta operacional de orgaos julgadores e juizos.',
    primaryField: 'nome',
    status: ORGAOS_JUDICIARIOS_STATUS,
    fields: ORGAOS_JUDICIARIOS_FIELDS,
  },
  serventias: {
    title: 'Serventias',
    singular: 'serventia',
    description: 'Gestao de serventias CNJ com competencia, comarca, contatos e origem de dados.',
    primaryField: 'nome_serventia',
    status: SERVENTIAS_STATUS,
    fields: SERVENTIAS_FIELDS,
  },
  'relacoes-processuais': {
    title: 'Relacoes Processuais',
    singular: 'relacao',
    description: 'Vinculos entre processos (apenso, incidente, recurso, dependencia) com visao de grafo.',
    primaryField: 'numero_cnj_filho',
    status: RELACOES_PROCESSUAIS_STATUS,
    fields: RELACOES_PROCESSUAIS_FIELDS,
  },
  tarefas: {
    title: 'Tarefas',
    singular: 'tarefa',
    description: 'Rotina interna com prioridades, responsáveis e prazos do caso.',
    primaryField: 'titulo',
    status: ['aberta', 'em_execucao', 'bloqueada', 'concluida', 'arquivada'],
    fields: [
      { key: 'titulo', label: 'Tarefa', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'prioridade', label: 'Prioridade', type: 'select', options: ['baixa', 'media', 'alta', 'critica'] },
      { key: 'prazo', label: 'Prazo', type: 'date' },
      { key: 'sla_horas', label: 'SLA em horas', type: 'number' },
      { key: 'perfil_responsavel', label: 'Perfil responsável', type: 'select', options: ['advogado', 'colaborador', 'financeiro', 'administrador'] },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'lembrete_em', label: 'Lembrete', type: 'datetime-local' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  agenda: {
    title: 'Agenda',
    singular: 'compromisso',
    description: 'Audiências, reuniões, retornos e compromissos operacionais.',
    primaryField: 'titulo',
    status: ['agendado', 'confirmado', 'realizado', 'remarcar', 'arquivado'],
    fields: [
      { key: 'titulo', label: 'Compromisso', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['reunião', 'audiência', 'retorno', 'prazo', 'interno'] },
      { key: 'data', label: 'Data', type: 'datetime-local' },
      { key: 'sla_horas', label: 'SLA em horas', type: 'number' },
      { key: 'perfil_responsavel', label: 'Perfil responsável', type: 'select', options: ['advogado', 'colaborador', 'financeiro', 'administrador'] },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'lembrete_em', label: 'Lembrete', type: 'datetime-local' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  mensagens: {
    title: 'Mensagens',
    singular: 'mensagem',
    description: 'Comunicações com clientes, canais e tratativas registradas.',
    primaryField: 'assunto',
    status: ['rascunho', 'enviada', 'respondida', 'pendente', 'arquivada'],
    fields: [
      { key: 'assunto', label: 'Assunto', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'thread_id', label: 'Thread', type: 'text' },
      { key: 'canal', label: 'Canal', type: 'select', options: ['portal', 'email', 'telefone', 'whatsapp', 'freshdesk'] },
      { key: 'tipo_evento', label: 'Evento', type: 'select', options: ['message.created', 'comment.created', 'attachment.added', 'timeline.event', 'onboarding.updated', 'client.history'] },
      { key: 'prazo', label: 'Retorno até', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'anexos', label: 'Anexos', type: 'text' },
      { key: 'visivel_cliente', label: 'Visível ao cliente', type: 'select', options: ['true', 'false'] },
      { key: 'observacao', label: 'Mensagem', type: 'textarea' },
    ],
  },
  financeiro: {
    title: 'Financeiro',
    singular: 'lançamento',
    description: 'Controle financeiro operacional do caso: honorários, custos e recebimentos.',
    primaryField: 'descricao',
    status: ['previsto', 'faturado', 'recebido', 'atrasado', 'arquivado'],
    fields: [
      { key: 'descricao', label: 'Descrição', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['renda', 'despesa', 'mínimo existencial', 'proposta', 'honorários', 'custo'] },
      { key: 'comprometimento', label: 'Comprometimento (%)', type: 'number' },
      { key: 'vencimento', label: 'Vencimento', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
};

function storageKey(moduleKey) {
  return `${STORAGE_PREFIX}${moduleKey}`;
}

function timelineKey(moduleKey) {
  return `${TIMELINE_PREFIX}${moduleKey}`;
}

function auditKey(moduleKey) {
  return `${AUDIT_PREFIX}${moduleKey}`;
}

function parseJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function persistJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function addLocalTimelineEvent(moduleKey, recordId, type, detail, payload = {}) {
  const events = parseJson(timelineKey(moduleKey), []);
  const event = {
    id: makeId(),
    recordId,
    type,
    detail,
    payload,
    createdAt: nowIso(),
  };
  events.unshift(event);
  persistJson(timelineKey(moduleKey), events.slice(0, 300));
  const audit = parseJson(auditKey(moduleKey), []);
  audit.unshift(event);
  persistJson(auditKey(moduleKey), audit.slice(0, 500));
  return event;
}

function mapRemoteRow(row) {
  return {
    id: row.id,
    ...(row.record_data || {}),
    status: row.status,
    archived: Boolean(row.archived_at),
    source: 'supabase',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
  };
}

function mapSourceRow(moduleKey, row, sourceConfig = {}) {
  const config = getAdvogadoModuleConfig(moduleKey);
  const statusKey = sourceConfig.statusField || 'status';
  const createdAt = row.created_at || row.data_hora_cadastro || row.data_movimentacao || row.data || null;
  const updatedAt = row.updated_at || row.data_hora_movimento || row.data_audiencia || createdAt;
  const archivedAt = row.archived_at || null;
  const deletedAt = row.deleted_at || null;
  const rawStatus = row[statusKey];

  return {
    id: row.id,
    ...row,
    status: rawStatus ?? config?.status?.[0] ?? 'ativo',
    archived: Boolean(archivedAt || deletedAt),
    source: 'supabase',
    createdAt,
    updatedAt,
    archivedAt,
    deletedAt,
  };
}

async function listSchemaModuleRecords(moduleKey) {
  const sourceConfig = MODULE_DATA_SOURCES[moduleKey];
  if (!sourceConfig) return null;

  const supabase = await getSupabaseClient();
  const scopedClient = sourceConfig.schema === 'judiciario'
    ? supabase.schema('judiciario')
    : supabase;

  const { data, error } = await scopedClient
    .from(sourceConfig.table)
    .select('*')
    .limit(500);

  if (error) {
    console.warn(`[RegistroAdvogadoService] ${moduleKey} schema list fallback:`, error.message);
    return null;
  }

  return (data || [])
    .map((row) => mapSourceRow(moduleKey, row, sourceConfig))
    .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime());
}

function mapPartesRow(row) {
  return {
    id: row.id,
    processo_id: row.processo_id,
    plano_pagamento_id: row.plano_pagamento_id,
    cliente_user_id: row.cliente_user_id,
    caso_id: row.caso_id,
    vinculo_status: row.vinculo_status || 'ativo',
    tenant_id: row.tenant_id,
    nome: row.nome,
    tipo: row.tipo,
    polo: row.polo,
    documento: row.documento,
    contact_id_freshsales: row.contact_id_freshsales,
    tipo_pessoa: row.tipo_pessoa,
    advogados: row.advogados,
    fonte: row.fonte,
    representada_pelo_escritorio: row.representada_pelo_escritorio,
    cliente_hmadv: row.cliente_hmadv,
    contato_freshsales_id: row.contato_freshsales_id,
    principal_no_account: row.principal_no_account,
    observacao: row.observacao,
    status: row.status || PARTES_STATUS[0],
    archived: Boolean(row.archived_at),
    source: 'supabase',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
  };
}

function toPartesPayload(payload = {}) {
  const {
    id,
    source,
    createdAt,
    updatedAt,
    archivedAt,
    deletedAt,
    archived,
    ...rest
  } = payload;

  return {
    processo_id: rest.processo_id || null,
    plano_pagamento_id: rest.plano_pagamento_id || null,
    cliente_user_id: rest.cliente_user_id || null,
    caso_id: rest.caso_id || null,
    vinculo_status: rest.vinculo_status || 'ativo',
    tenant_id: rest.tenant_id || null,
    nome: rest.nome || null,
    tipo: rest.tipo || null,
    polo: rest.polo || null,
    documento: rest.documento || null,
    contact_id_freshsales: rest.contact_id_freshsales || null,
    tipo_pessoa: rest.tipo_pessoa || null,
    advogados: rest.advogados || null,
    fonte: rest.fonte || null,
    representada_pelo_escritorio: rest.representada_pelo_escritorio || null,
    cliente_hmadv: rest.cliente_hmadv || null,
    contato_freshsales_id: rest.contato_freshsales_id || null,
    principal_no_account: rest.principal_no_account || null,
    observacao: rest.observacao || null,
    status: rest.status || PARTES_STATUS[0],
    archived_at: archived === true ? (archivedAt || nowIso()) : null,
  };
}

function toRemotePayload(moduleKey, payload = {}) {
  const status = payload.status || getAdvogadoModuleConfig(moduleKey)?.status?.[0] || 'ativo';
  const archivedAt = payload.archived === true ? (payload.archivedAt || nowIso()) : null;
  const { id, source, createdAt, updatedAt, archivedAt: _archivedAt, deletedAt, ...recordData } = payload;
  return {
    module_key: moduleKey,
    status,
    archived_at: archivedAt,
    record_data: recordData,
  };
}

async function getCurrentUserId() {
  const supabase = await getSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

async function getCurrentWorkspaceId() {
  if (!currentWorkspacePromise) {
    currentWorkspacePromise = getSupabaseClient()
      .then(supabase => supabase.rpc('current_workspace_id'))
      .then(({ data, error }) => error ? null : data)
      .catch(() => null);
  }
  return currentWorkspacePromise;
}

async function writeAudit(moduleKey, recordId, action, payload = {}) {
  const supabase = await getSupabaseClient();
  const actor = await getCurrentUserId().catch(() => null);
  const { error } = await supabase
    .from(AUDIT_TABLE)
    .insert({
      record_id: recordId,
      module_key: moduleKey,
      action,
      payload,
      actor_uid: actor,
    });

  if (error) {
    addLocalTimelineEvent(moduleKey, recordId, action, `Auditoria local: ${action}`, payload);
  }
}

export function getAdvogadoModuleConfig(moduleKey) {
  return ADVOGADO_MODULES[moduleKey] || null;
}

export async function listAdvogadoRecords(moduleKey) {
  if (moduleKey === 'partes') {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from(PARTES_LINKS_TABLE)
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (!error) return (data || []).map(mapPartesRow);

    console.warn('[RegistroAdvogadoService] Partes list fallback:', error.message);
    return parseJson(storageKey(moduleKey), []);
  }

  const schemaRows = await listSchemaModuleRecords(moduleKey);
  if (schemaRows) return schemaRows;

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from(OPERATIONAL_TABLE)
    .select('*')
    .eq('module_key', moduleKey)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (!error) return (data || []).map(mapRemoteRow);

  console.warn('[RegistroAdvogadoService] Supabase list fallback:', error.message);
  return parseJson(storageKey(moduleKey), []);
}

export async function saveAdvogadoRecord(moduleKey, payload, existingId = null) {
  const config = getAdvogadoModuleConfig(moduleKey);
  if (!config) throw new Error('Módulo não encontrado');

  const timestamp = nowIso();
  const normalized = {
    ...payload,
    status: payload.status || config.status[0],
    archived: payload.archived === true,
    source: 'local',
    updatedAt: timestamp,
  };

  if (moduleKey === 'partes') {
    const supabase = await getSupabaseClient();
    const workspaceId = await getCurrentWorkspaceId();
    const actor = await getCurrentUserId().catch(() => null);
    const partesPayload = {
      ...toPartesPayload(normalized),
      workspace_id: workspaceId || null,
      updated_by: actor,
    };

    if (existingId) {
      const { data, error } = await supabase
        .from(PARTES_LINKS_TABLE)
        .update(partesPayload)
        .eq('id', existingId)
        .select()
        .maybeSingle();

      if (!error && data) {
        await writeAudit(moduleKey, existingId, 'updated', normalized);
        return mapPartesRow(data);
      }

      console.warn('[RegistroAdvogadoService] Partes update fallback:', error?.message);
      const records = parseJson(storageKey(moduleKey), []);
      const index = records.findIndex(record => record.id === existingId);
      if (index < 0) throw new Error('Registro não encontrado');
      records[index] = { ...records[index], ...normalized };
      persistJson(storageKey(moduleKey), records);
      addLocalTimelineEvent(moduleKey, existingId, 'updated', 'Registro atualizado', normalized);
      return records[index];
    }

    const { data, error } = await supabase
      .from(PARTES_LINKS_TABLE)
      .insert({ ...partesPayload, created_by: actor })
      .select()
      .single();

    if (!error && data) {
      await writeAudit(moduleKey, data.id, 'created', normalized);
      return mapPartesRow(data);
    }

    console.warn('[RegistroAdvogadoService] Partes insert fallback:', error?.message);
    const records = parseJson(storageKey(moduleKey), []);
    const record = {
      id: makeId(),
      createdAt: timestamp,
      ...normalized,
    };
    records.unshift(record);
    persistJson(storageKey(moduleKey), records);
    addLocalTimelineEvent(moduleKey, record.id, 'created', 'Registro criado', normalized);
    return record;
  }

  const remotePayload = toRemotePayload(moduleKey, normalized);
  const workspaceId = await getCurrentWorkspaceId();
  if (workspaceId && !remotePayload.workspace_id) remotePayload.workspace_id = workspaceId;

  if (existingId) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from(OPERATIONAL_TABLE)
      .update({ ...remotePayload, updated_by: await getCurrentUserId().catch(() => null) })
      .eq('id', existingId)
      .select()
      .maybeSingle();

    if (!error && data) {
      await writeAudit(moduleKey, existingId, 'updated', normalized);
      return mapRemoteRow(data);
    }

    console.warn('[RegistroAdvogadoService] Supabase update fallback:', error?.message);
    const records = parseJson(storageKey(moduleKey), []);
    const index = records.findIndex(record => record.id === existingId);
    if (index < 0) throw new Error('Registro não encontrado');
    records[index] = { ...records[index], ...normalized };
    persistJson(storageKey(moduleKey), records);
    addLocalTimelineEvent(moduleKey, existingId, 'updated', 'Registro atualizado', normalized);
    return records[index];
  }

  const actor = await getCurrentUserId().catch(() => null);
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from(OPERATIONAL_TABLE)
    .insert({ ...remotePayload, created_by: actor, updated_by: actor })
    .select()
    .single();

  if (!error && data) {
    await writeAudit(moduleKey, data.id, 'created', normalized);
    return mapRemoteRow(data);
  }

  console.warn('[RegistroAdvogadoService] Supabase insert fallback:', error?.message);
  const records = parseJson(storageKey(moduleKey), []);
  const record = {
    id: makeId(),
    createdAt: timestamp,
    ...normalized,
  };
  records.unshift(record);
  persistJson(storageKey(moduleKey), records);
  addLocalTimelineEvent(moduleKey, record.id, 'created', 'Registro criado', normalized);
  return record;
}

export async function archiveAdvogadoRecord(moduleKey, recordId) {
  const timestamp = nowIso();
  if (moduleKey === 'partes') {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from(PARTES_LINKS_TABLE)
      .update({
        archived_at: timestamp,
        status: 'arquivado',
        vinculo_status: 'inativo',
        updated_by: await getCurrentUserId().catch(() => null),
      })
      .eq('id', recordId)
      .select()
      .maybeSingle();

    if (!error && data) {
      await writeAudit(moduleKey, recordId, 'archived', { archivedAt: timestamp });
      return mapPartesRow(data);
    }

    console.warn('[RegistroAdvogadoService] Partes archive fallback:', error?.message);
    const records = parseJson(storageKey(moduleKey), []);
    const index = records.findIndex(record => record.id === recordId);
    if (index < 0) return null;
    records[index] = {
      ...records[index],
      archived: true,
      status: 'arquivado',
      vinculo_status: 'inativo',
      archivedAt: timestamp,
      updatedAt: timestamp,
    };
    persistJson(storageKey(moduleKey), records);
    addLocalTimelineEvent(moduleKey, recordId, 'archived', 'Registro arquivado', { archivedAt: timestamp });
    return records[index];
  }

  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from(OPERATIONAL_TABLE)
    .update({ archived_at: timestamp, status: 'arquivado', updated_by: await getCurrentUserId().catch(() => null) })
    .eq('id', recordId)
    .select()
    .maybeSingle();

  if (!error && data) {
    await writeAudit(moduleKey, recordId, 'archived', { archivedAt: timestamp });
    return mapRemoteRow(data);
  }

  console.warn('[RegistroAdvogadoService] Supabase archive fallback:', error?.message);
  const records = parseJson(storageKey(moduleKey), []);
  const index = records.findIndex(record => record.id === recordId);
  if (index < 0) return null;
  records[index] = {
    ...records[index],
    archived: true,
    status: 'arquivado',
    archivedAt: timestamp,
    updatedAt: timestamp,
  };
  persistJson(storageKey(moduleKey), records);
  addLocalTimelineEvent(moduleKey, recordId, 'archived', 'Registro arquivado', { archivedAt: timestamp });
  return records[index];
}

export async function deleteAdvogadoRecord(moduleKey, recordId) {
  const timestamp = nowIso();
  if (moduleKey === 'partes') {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from(PARTES_LINKS_TABLE)
      .update({ deleted_at: timestamp, updated_by: await getCurrentUserId().catch(() => null) })
      .eq('id', recordId);

    if (!error) {
      await writeAudit(moduleKey, recordId, 'deleted', { deletedAt: timestamp });
      return;
    }

    console.warn('[RegistroAdvogadoService] Partes delete fallback:', error.message);
    const records = parseJson(storageKey(moduleKey), []);
    const next = records.filter(record => record.id !== recordId);
    persistJson(storageKey(moduleKey), next);
    addLocalTimelineEvent(moduleKey, recordId, 'deleted', 'Registro excluído', { deletedAt: timestamp });
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from(OPERATIONAL_TABLE)
    .update({ deleted_at: timestamp, updated_by: await getCurrentUserId().catch(() => null) })
    .eq('id', recordId);

  if (!error) {
    await writeAudit(moduleKey, recordId, 'deleted', { deletedAt: timestamp });
    return;
  }

  console.warn('[RegistroAdvogadoService] Supabase delete fallback:', error.message);
  const records = parseJson(storageKey(moduleKey), []);
  const next = records.filter(record => record.id !== recordId);
  persistJson(storageKey(moduleKey), next);
  addLocalTimelineEvent(moduleKey, recordId, 'deleted', 'Registro excluído', { deletedAt: timestamp });
}

export async function listAdvogadoTimeline(moduleKey, recordId = null) {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from(AUDIT_TABLE)
    .select('*')
    .eq('module_key', moduleKey)
    .order('created_at', { ascending: false })
    .limit(80);

  if (recordId) query = query.eq('record_id', recordId);

  const { data, error } = await query;
  if (!error) {
    return (data || []).map(event => ({
      id: event.id,
      recordId: event.record_id,
      type: event.action,
      detail: event.payload?.detail || `Registro ${event.action}`,
      payload: event.payload || {},
      createdAt: event.created_at,
    }));
  }

  const events = parseJson(timelineKey(moduleKey), []);
  return recordId ? events.filter(event => event.recordId === recordId) : events;
}

export async function listAdvogadoAudit(moduleKey, recordId = null) {
  return listAdvogadoTimeline(moduleKey, recordId);
}

export function filterAdvogadoRecords(records, filters = {}) {
  const query = String(filters.query || '').trim().toLowerCase();
  const status = filters.status || 'todos';
  const archived = filters.archived === true;
  const processoId = String(filters.processoId || '').trim().toLowerCase();
  const planoPagamentoId = String(filters.planoPagamentoId || '').trim().toLowerCase();
  const clienteUserId = String(filters.clienteUserId || '').trim().toLowerCase();
  const vinculoStatus = filters.vinculoStatus || 'todos';

  return records.filter(record => {
    if (Boolean(record.archived) !== archived) return false;
    if (status !== 'todos' && record.status !== status) return false;
    if (processoId && !String(record.processo_id || '').toLowerCase().includes(processoId)) return false;
    if (planoPagamentoId && !String(record.plano_pagamento_id || '').toLowerCase().includes(planoPagamentoId)) return false;
    if (clienteUserId && !String(record.cliente_user_id || '').toLowerCase().includes(clienteUserId)) return false;
    if (vinculoStatus !== 'todos' && String(record.vinculo_status || 'ativo') !== vinculoStatus) return false;
    if (!query) return true;
    return Object.values(record).some(value => String(value ?? '').toLowerCase().includes(query));
  });
}

export function paginateAdvogadoRecords(records, page = 1, pageSize = 8) {
  const total = records.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageSize,
    total,
    pages,
    rows: records.slice(start, start + pageSize),
  };
}
