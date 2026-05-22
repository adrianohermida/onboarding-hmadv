# Varredura final UX mobile-first (admin + cliente)

Data: 2026-05-21
Escopo: fluxo completo autenticado do portal em pages/*.html

## Checklist aplicado por pagina

- [x] Shell persistente carregado (`data-component="sidebar"`, `data-component="header"`, `main.page-content`)
- [x] Drawer mobile ativo (sidebar overlay com toggle, swipe e ESC)
- [x] Safe-area iOS/Android ativo (`viewport-fit=cover`, `env(safe-area-inset-bottom)`)
- [x] Breadcrumb de navegacao ativo (`header-breadcrumb`, `header-page-title`)
- [x] Tabela responsiva ativa (`.table-wrap` com fallback card em mobile)

## Fluxo cliente validado

- meu-caso
- custas
- meus-documentos
- contratos
- meu-plano
- plano-pagamento
- mensagens
- ajuda
- onboarding-v2
- financial-dashboard
- suporte
- onboarding

## Fluxo admin validado

- painel
- clientes
- partes
- documentos
- planos
- processos
- movimentacoes
- publicacoes
- audiencias
- prazos
- custas-processuais
- financeiro-processual
- relacoes-processuais
- tpu
- orgaos-judiciarios
- serventias
- tarefas
- agenda
- mensagens
- onboarding-v2
- financial-dashboard
- suporte
- onboarding
- ai-copilot
- experiencia-cliente
- financeiro-inteligencia
- operacoes-juridicas
- compliance
- platform-os
- ui-os
- workspace-os
- financeiro
- analytics
- billing-os

## Evidencia tecnica

- Contrato automatizado: tests/mobile-ux-checklist-contract.test.js
- Regras de drawer/safe-area: styles/layout.css e modules/ui/Shell.js
- Regras de tabela responsiva: styles/components.css
