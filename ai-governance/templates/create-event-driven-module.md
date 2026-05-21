# Template: create-event-driven-module

## Objetivo
Criar modulo orientado a eventos e contracts.

## Contexto
Fundacao shell enterprise e registries ativos.

## Boundaries
Sem eventos arbitrarios e sem loops.

## Constraints
Registrar eventos, ownership e quality gates.

## Arquitetura
Event-first, module manifest, lazy loading.

## Regras tenant
Eventos e estado com awareness de tenant.

## Regras shell
Sem acoplamento direto a internals.

## Regras seguranca
Sem dados sensiveis em payloads.

## Output esperado
Modulo + registry updates + testes.
