# Template: create-enterprise-module

## Objetivo
Criar modulo enterprise plugavel sem quebrar shell/tenant/contracts.

## Contexto
Modulo novo para ecossistema HMADV.

## Boundaries
Sem alterar shell core fora contracts aprovados.

## Constraints
Exigir manifest, contracts, observability, permissions, ownership.

## Arquitetura
Module-first, event-driven, lazy-loaded.

## Regras tenant
Tenant isolation obrigatoria.

## Regras shell
Sem recriar sidebar/header/providers.

## Regras seguranca
Sem secrets, sem alteracoes RLS sem review.

## Output esperado
Arquivos do modulo + docs + checklist de review.
