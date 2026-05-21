# Template: refactor-shell-safe

## Objetivo
Refatorar com seguranca mantendo compatibilidade do shell.

## Contexto
Mudanca incremental sem regressao.

## Boundaries
Sem criar contextos globais paralelos.

## Constraints
Preservar contracts, eventos, lazy loading e responsive.

## Arquitetura
Orquestracao shell + logica de dominio desacoplada.

## Regras tenant
Sem quebra de isolamento por workspace.

## Regras shell
Sem duplicar layout persistente.

## Regras seguranca
Sem tocar auth/rls criticos sem review.

## Output esperado
Patch minimo + impacto + rollback.
