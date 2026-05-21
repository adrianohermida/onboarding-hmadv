# Prompt: Tenant Isolation Review

## Objetivo
Validar se alteracoes preservam isolamento multi-tenant.

## Contexto
Arquitetura por workspace com boundaries estritos.

## Boundaries
Sem aceitar qualquer leitura/escrita cross-tenant.

## Constraints
Analisar consultas, caches, eventos e ownership.

## Arquitetura
Tenant-aware by design em contratos e estado.

## Regras tenant
Tenant key obrigatoria em pontos criticos.

## Regras shell
Shell nao deve burlar tenant context.

## Regras seguranca
Risco alto exige bloqueio e escalacao.

## Output esperado
Parecer de conformidade tenant-safe.
