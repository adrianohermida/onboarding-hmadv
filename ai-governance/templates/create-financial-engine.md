# Template: create-financial-engine

## Objetivo
Implementar capacidades financeiras com governanca.

## Contexto
Dominio financeiro sensivel e orientado a contratos.

## Boundaries
Sem mover logica financeira para shell.

## Constraints
Exigir testes, observabilidade e permissao explicita.

## Arquitetura
Engine desacoplada + eventos + modulo plugavel.

## Regras tenant
Sem mistura de dados entre workspaces.

## Regras shell
Shell apenas orquestra fluxo.

## Regras seguranca
Sem alteracao de auth/rls sem revisao.

## Output esperado
Engine + contratos + playbook de modulo.
