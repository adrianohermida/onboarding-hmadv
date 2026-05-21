# Template: create-onboarding-step

## Objetivo
Adicionar passo de onboarding sem quebrar jornada.

## Contexto
Jornada existente com shell persistente.

## Boundaries
Sem reload estrutural e sem duplicar providers.

## Constraints
Manter contratos de evento e telemetria.

## Arquitetura
Step plugavel, lazy e mobile-first.

## Regras tenant
Dados e progresso isolados por tenant/user.

## Regras shell
Integrar via contracts/event bus.

## Regras seguranca
Sem alteracoes auth sem review.

## Output esperado
Step funcional + observabilidade + docs.
