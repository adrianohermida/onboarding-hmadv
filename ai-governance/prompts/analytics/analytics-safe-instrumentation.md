# Prompt: Analytics Safe Instrumentation

## Objetivo
Adicionar telemetria sem degradar desempenho ou vazar dados.

## Contexto
Observabilidade shell e modulos orientados a eventos.

## Boundaries
Sem coletar secrets ou dados sensiveis indevidos.

## Constraints
Definir eventos, payload minimo e retention strategy.

## Arquitetura
Observabilidade desacoplada e auditavel.

## Regras tenant
Separar telemetria por tenant quando aplicavel.

## Regras shell
Nao interferir no lifecycle principal.

## Regras seguranca
No PII sem base legal e revisao.

## Output esperado
Pontos de telemetria + metricas + dashboard contract.
