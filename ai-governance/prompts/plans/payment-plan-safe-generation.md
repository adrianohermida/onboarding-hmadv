# Prompt: Payment Plan Safe Generation

## Objetivo
Gerar funcionalidades de plano de pagamento com governanca.

## Contexto
Dominio financeiro/juridico sensivel.

## Boundaries
Sem codigo fora boundaries de modulo.

## Constraints
Permissions, observability e tenant awareness obrigatorios.

## Arquitetura
Modulo plugavel com eventos e contratos.

## Regras tenant
Calculos e persistencia isolados por tenant.

## Regras shell
Sem acoplamento ao core shell.

## Regras seguranca
Sem alterar politicas de dados sem review.

## Output esperado
Implementacao segura + checklist de revisao.
