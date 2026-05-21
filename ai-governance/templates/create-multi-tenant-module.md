# Template: create-multi-tenant-module

## Objetivo
Criar modulo tenant-aware com isolamento e ownership.

## Contexto
Modulo para operacao multi-workspace.

## Boundaries
Sem bypass de tenant e sem acesso cross-tenant.

## Constraints
Obrigatorio: manifest, permissions, observability, docs.

## Arquitetura
Feature-flag-ready, event-driven, contract-first.

## Regras tenant
Tenant keys em cache/state/events quando aplicavel.

## Regras shell
Uso exclusivo de shell contracts.

## Regras seguranca
Sem alteracao de politicas sem Security Review.

## Output esperado
Modulo pronto + evidencias de isolamento.
