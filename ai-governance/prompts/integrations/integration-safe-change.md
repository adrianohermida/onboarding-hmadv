# Prompt: Integration Safe Change

## Objetivo
Evoluir integracoes externas com seguranca e confiabilidade.

## Contexto
Integracoes Freshdesk, Autentique e futuras automacoes.

## Boundaries
Sem acesso ou exposicao de secrets.

## Constraints
Timeout/retry/fallback e observabilidade obrigatorios.

## Arquitetura
Camada de servico desacoplada + edge governance.

## Regras tenant
Contexto tenant deve acompanhar chamadas quando aplicavel.

## Regras shell
Sem logica de integracao no shell.

## Regras seguranca
Sem deploy direto em producao por IA.

## Output esperado
Mudanca segura + testes + runbook.
