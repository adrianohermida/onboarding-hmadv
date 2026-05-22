import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRoutes, getSidebarModules } from '../js/navigation.js';
import { ADVOGADO_MODULES } from '../modules/advogado/RegistroAdvogadoService.js';

const root = process.cwd();

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

function fieldKeys(moduleKey) {
  return new Set((ADVOGADO_MODULES[moduleKey]?.fields || []).map((field) => field.key));
}

const REQUIRED_SCHEMA_FIELDS = {
  processos: [
    'numero_cnj', 'numero_processo', 'titulo', 'classe', 'assunto', 'assunto_principal',
    'orgao_julgador', 'julgador', 'tribunal', 'ramo', 'comarca', 'grau', 'instancia',
    'tipo_acao', 'tipo_processo_geral', 'status_atual_processo', 'prioridade', 'polo_ativo',
    'polo_passivo', 'valor_causa', 'segredo_justica', 'arquivado', 'data_ajuizamento',
    'data_distribuicao', 'data_ultima_movimentacao', 'data_ultimo_movimento', 'ultimo_movimento_em',
    'data_ultima_atualizacao_externa', 'sistema', 'area', 'link_externo_processo',
    'monitorado_escavador', 'cliente_id', 'advogado_responsavel_id', 'escritorio_id',
    'is_sample', 'classe_codigo', 'sistema_codigo', 'orgao_julgador_codigo', 'formato',
    'account_id_freshsales', 'dados_incompletos', 'fonte_criacao', 'classe_id',
    'assunto_principal_id', 'assunto_ids', 'orgao_julgador_tpu_id', 'parte_representada_adriano',
    'fs_sync_at', 'fs_sync_hash', 'datajud_status', 'datajud_last_attempt_at',
    'datajud_last_success_at', 'datajud_last_error', 'datajud_nao_enriquecivel',
    'datajud_payload_hash', 'serventia_cnj_id', 'juizo_cnj_id', 'codigo_foro_local',
    'parser_tribunal_schema', 'parser_grau', 'parser_sistema', 'status_fonte',
    'status_detectado_em', 'status_evento_origem', 'monitoramento_ativo',
    'fs_tag_leilao_aplicada', 'freshsales_synced_at',
  ],
  partes: [
    'processo_id', 'tenant_id', 'nome', 'tipo', 'polo', 'documento', 'contact_id_freshsales',
    'tipo_pessoa', 'advogados', 'fonte', 'representada_pelo_escritorio', 'cliente_hmadv',
    'contato_freshsales_id', 'principal_no_account',
  ],
  audiencias: [
    'processo_id', 'origem', 'origem_id', 'tipo', 'data_audiencia', 'descricao', 'local',
    'situacao', 'metadata', 'freshsales_activity_id',
  ],
  publicacoes: [
    'processo_id', 'data_publicacao', 'conteudo', 'tem_prazo', 'prazo_data',
    'advise_id_publicacao_cliente', 'advise_id_publicacao', 'advise_id_mov_usuario_cliente',
    'advise_id_cliente', 'advise_id_usuario_cliente', 'advise_cod_publicacao',
    'advise_cod_diario', 'advise_cod_caderno', 'advise_id_municipio',
    'advise_id_caderno_diario_edicao', 'data_hora_movimento', 'data_hora_cadastro',
    'ativo', 'ativo_publicacao', 'ano_publicacao', 'edicao_diario',
    'cidade_comarca_descricao', 'vara_descricao', 'pagina_inicial_publicacao',
    'pagina_final_publicacao', 'despacho', 'corrigido', 'lido', 'nome_diario',
    'descricao_diario', 'nome_caderno_diario', 'descricao_caderno_diario',
    'nome_cliente', 'nome_usuario_cliente', 'numero_processo_api', 'raw_payload',
    'freshsales_activity_id', 'freshsales_task_id', 'adriano_polo', 'processual',
    'tipo_documento', 'motivo_sem_processo', 'triagem_manual', 'ai_resumo',
    'ai_tipo_ato', 'ai_prazo_sugerido', 'ai_urgencia', 'ai_enriquecido_at',
    'ai_tokens_usados', 'freshsales_synced_at', 'fs_sync_status', 'fs_sync_error',
    'fs_sync_retries', 'fs_sync_next_retry',
  ],
  movimentacoes: [
    'processo_id', 'fonte', 'data_movimentacao', 'conteudo', 'movimento_tpu_id',
    'tipo_movimento_nome', 'freshsales_activity_id', 'fs_activity_id', 'raw_payload',
  ],
  prazos: [
    'processo_id', 'publicacao_id', 'movimento_id', 'evento_tipo', 'titulo',
    'data_base', 'data_inicio_contagem', 'data_vencimento', 'prioridade',
    'freshsales_task_id', 'google_event_id', 'metadata', 'prazo_dias',
  ],
  'financeiro-processual': [
    'processo_id', 'data', 'descricao', 'categoria', 'centro_custo',
    'valor', 'situacao', 'criado_em',
  ],
  'custas-processuais': [
    'processo_id', 'descricao', 'categoria', 'valor', 'data',
    'situacao', 'data_vencimento', 'comprovante',
  ],
  tpu: [
    'tipo_tpu', 'codigo_cnj', 'nome', 'descricao', 'sigla',
    'tipo', 'gera_prazo', 'prazo_sugerido_dias', 'versao_cnj', 'gateway_payload',
  ],
  'orgaos-judiciarios': [
    'codigo_cnj', 'nome', 'tribunal', 'grau', 'orgao_julgador',
    'especialidade', 'municipio', 'uf', 'juizo_100_digital', 'serventia_id',
  ],
  serventias: [
    'tribunal', 'nome_serventia', 'numero_serventia', 'tipo_orgao', 'competencia',
    'codigo_municipio_ibge', 'municipio', 'uf', 'endereco', 'metadata',
  ],
  'relacoes-processuais': [
    'processo_pai_id', 'processo_filho_id', 'numero_cnj_pai', 'numero_cnj_filho',
    'tipo_relacao', 'status', 'observacoes', 'grafo',
  ],
};

describe('judiciario schema coverage contract', () => {
  it('keeps all operational judiciario modules mapped in ADVOGADO_MODULES', () => {
    const adminModules = getSidebarModules({ isAdmin: true }).map((item) => item.key);
    const routes = getRoutes();

    ['processos', 'partes', 'movimentacoes', 'publicacoes', 'audiencias', 'prazos', 'custas-processuais', 'financeiro-processual', 'tpu', 'orgaos-judiciarios', 'serventias', 'relacoes-processuais'].forEach((moduleKey) => {
      expect(ADVOGADO_MODULES[moduleKey]).toBeTruthy();
      expect(adminModules).toContain(moduleKey);
      expect(routes[moduleKey]).toBeTruthy();
    });
  });

  it('covers required judiciario schema fields for each operational module', () => {
    Object.entries(REQUIRED_SCHEMA_FIELDS).forEach(([moduleKey, requiredKeys]) => {
      const keys = fieldKeys(moduleKey);
      requiredKeys.forEach((key) => {
        expect(keys.has(key)).toBe(true);
      });
    });
  });

  it('ships shell-mounted pages for all operational judiciario modules', () => {
    ['processos', 'movimentacoes', 'publicacoes', 'audiencias', 'prazos', 'custas-processuais', 'financeiro-processual', 'tpu', 'orgaos-judiciarios', 'serventias', 'relacoes-processuais'].forEach((key) => {
      const html = readFile('pages', `${key}.html`);

      expect(html).toContain('data-component="sidebar"');
      expect(html).toContain('data-component="header"');
      expect(html).toContain('data-advogado-module-host');
      expect(html).toContain('../js/app.js?v=20260522b');
      expect(html).toContain(`bootAdvogadoPage('${key}')`);
    });
  });
});
