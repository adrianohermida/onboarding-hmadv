# Prompt: Onboarding Step Safe

## Objetivo
Adicionar ou ajustar passo de onboarding sem regressao de jornada.

## Contexto
Onboarding integrado ao shell persistente e contratos de evento.

## Boundaries
Sem recriar layout persistente.

## Constraints
Mobile-first e acessibilidade obrigatorios.

## Arquitetura
Step plugavel, observavel e lazy.

## Regras tenant
Progresso e dados isolados por tenant/user.

## Regras shell
Interagir por event bus e shell contracts.

## Regras seguranca
Sem alteracao de auth critico.

## Output esperado
Passo pronto + docs + quality gates atendidos.
