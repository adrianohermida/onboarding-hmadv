# Prompt: Document Workflow Change

## Objetivo
Evoluir workflow de documentos com seguranca e rastreabilidade.

## Contexto
Modulo de documentos integrado a shell e eventos.

## Boundaries
Sem alterar shell internals ou storage policy sem review.

## Constraints
Manter contracts, observability e permissions.

## Arquitetura
Workflow modular orientado a eventos.

## Regras tenant
Dados/documentos isolados por tenant/workspace.

## Regras shell
Sem duplicar loaders/contextos.

## Regras seguranca
Sem acesso/uso de secrets em codigo gerado.

## Output esperado
Mudanca no modulo + docs + checklist de revisao.
