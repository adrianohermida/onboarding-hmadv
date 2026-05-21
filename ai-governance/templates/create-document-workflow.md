# Template: create-document-workflow

## Objetivo
Criar workflow de documentos orientado a eventos.

## Contexto
Integracao com pipeline documental existente.

## Boundaries
Sem duplicar engines ou shell internals.

## Constraints
Incluir manifest, contracts, observability e permissions.

## Arquitetura
Workflow modular com eventos e estados rastreaveis.

## Regras tenant
Storage e metadados particionados por tenant.

## Regras shell
Acoes globais via contracts.

## Regras seguranca
Sem politicas storage sem review.

## Output esperado
Workflow + docs + checklist de compliance.
