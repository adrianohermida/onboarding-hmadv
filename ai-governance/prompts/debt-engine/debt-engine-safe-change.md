# Prompt: Debt Engine Safe Change

## Objetivo
Evoluir debt engine mantendo estabilidade de eventos e contratos.

## Contexto
Debt engine integra com dashboard e fluxo financeiro.

## Boundaries
Sem criar eventos arbitrarios e sem loops.

## Constraints
Registrar eventos e validar compatibilidade retroativa.

## Arquitetura
Engine desacoplada com event contracts.

## Regras tenant
Estado e calculos isolados por caso/tenant.

## Regras shell
Sem acoplamento direto a internals de shell.

## Regras seguranca
Sem bypass de permissions.

## Output esperado
Mudanca segura + evidencias de compliance de eventos.
