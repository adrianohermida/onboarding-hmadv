# Auditoria Judiciario + RLS + CRUD

## Escopo
- Aplicacao do schema judiciario no repositorio
- RLS para tabelas criticas do dominio juridico
- Matriz READ / CREATE / UPDATE / DELETE

## Pendencia encontrada
- Ausencia de migration dedicada para RLS/CRUD no schema judiciario em 20 tabelas criticas.

## Acao de conclusao
- Migration criada: supabase/migrations-safe/20260521_safe_016_judiciario_rls_crud_hardening.sql
- Estrategia aplicada:
  - ENABLE RLS e FORCE RLS
  - 4 politicas por tabela (READ/CREATE/UPDATE/DELETE)
  - Escopo de autorizacao: authenticated + is_any_admin()

## Status 20 PAR (CRUD)
- processos: READ/CREATE/UPDATE/DELETE = OK
- partes: READ/CREATE/UPDATE/DELETE = OK
- audiencias: READ/CREATE/UPDATE/DELETE = OK
- publicacoes: READ/CREATE/UPDATE/DELETE = OK
- movimentacoes: READ/CREATE/UPDATE/DELETE = OK
- movimentos: READ/CREATE/UPDATE/DELETE = OK
- monitoramento_queue: READ/CREATE/UPDATE/DELETE = OK
- processo_cobertura_sync: READ/CREATE/UPDATE/DELETE = OK
- processo_contato_sync: READ/CREATE/UPDATE/DELETE = OK
- processo_relacoes: READ/CREATE/UPDATE/DELETE = OK
- sync_divergencias: READ/CREATE/UPDATE/DELETE = OK
- financeiro_processual: READ/CREATE/UPDATE/DELETE = OK
- riscos_processuais: READ/CREATE/UPDATE/DELETE = OK
- prazo_calculado: READ/CREATE/UPDATE/DELETE = OK
- prazo_evento: READ/CREATE/UPDATE/DELETE = OK
- prazo_regra: READ/CREATE/UPDATE/DELETE = OK
- prazo_regra_alias: READ/CREATE/UPDATE/DELETE = OK
- prazo_tarefa: READ/CREATE/UPDATE/DELETE = OK
- operacao_jobs: READ/CREATE/UPDATE/DELETE = OK
- operacao_execucoes: READ/CREATE/UPDATE/DELETE = OK

## Evidencias de validacao
- Teste de contrato: tests/judiciario-rls-crud-contract.test.js
- Teste de cobertura de schema operacional: tests/judiciario-schema-coverage-contract.test.js
