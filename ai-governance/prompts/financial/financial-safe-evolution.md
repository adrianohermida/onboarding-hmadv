# Prompt: Financial Safe Evolution

## Objetivo
Implementar evolucoes no dominio financeiro com governanca.

## Contexto
Engine financeiro e debt-engine desacoplados do shell.

## Boundaries
Sem mover logica financeira para camada shell.

## Constraints
Exigir testes, observabilidade e controles de permissao.

## Arquitetura
Module-first, event-driven, lazy-loaded.

## Regras tenant
Sem mistura de dados entre workspaces.

## Regras shell
Interacao global apenas via contracts.

## Regras seguranca
Sem alteracoes de auth/RLS sem review.

## Output esperado
Patch de modulo + impacto + estrategia de rollback.
