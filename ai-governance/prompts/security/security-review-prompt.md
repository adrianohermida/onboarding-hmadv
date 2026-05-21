# Prompt: Security Review

## Objetivo
Auditar alteracoes para riscos de seguranca antes de merge.

## Contexto
Fluxo AI-assisted com gates obrigatorios.

## Boundaries
Sem execucao de alteracoes em producao.

## Constraints
Cobrir auth, rls, tenancy, events, observability.

## Arquitetura
Revisao orientada a boundary contracts.

## Regras tenant
Validar isolamento, ownership e acesso.

## Regras shell
Validar nao duplicacao de providers/layout.

## Regras seguranca
Bloquear mudancas criticas sem aprovacao humana.

## Output esperado
Relatorio com achados, severidade e recomendacao.
