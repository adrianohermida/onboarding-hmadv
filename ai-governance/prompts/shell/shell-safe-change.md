# Prompt: Shell Safe Change

## Objetivo
Implementar mudancas no shell sem quebrar persistencia visual e boundaries.

## Contexto
Shell enterprise modular (sprints 0.1/0.2) ja em producao controlada.

## Boundaries
Sem logica de dominio no shell.

## Constraints
Nao recriar sidebar/header/providers globais.

## Arquitetura
Orquestracao shell + contracts + event bus.

## Regras tenant
Preservar isolamento e branding por tenant.

## Regras shell
Usar somente contratos compartilhados.

## Regras seguranca
Sem alteracao auth/rls sem review.

## Output esperado
Patch minimo + impacto + rollback + evidencias de compatibilidade.
