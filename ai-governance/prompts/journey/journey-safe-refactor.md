# Prompt: Journey Safe Refactor

## Objetivo
Refatorar jornada preservando compatibilidade funcional.

## Contexto
Modulo de jornada conectado a onboarding e notificacoes.

## Boundaries
Sem alterar fronteiras de modulo sem ADR.

## Constraints
Preservar eventos existentes e contratos.

## Arquitetura
Refatoracao incremental orientada a contratos.

## Regras tenant
Sem risco de cruzamento de dados entre workspaces.

## Regras shell
Sem contexto global paralelo.

## Regras seguranca
Sem mudancas sensiveis sem revisao.

## Output esperado
Refatoracao + analise de impacto + rollback.
