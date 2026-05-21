# Checklist Fase 4 — Visual e Interacao

## Tipografia
- [x] Tokens globais de tipografia alinhados para Lucida/Arial em styles/variables.css
- [x] Removido import externo DM Sans/Libre de styles/main.css
- [x] Titulos globais padronizados com var(--sans)
- [x] Overrides locais DM Sans removidos em dashboards customizados

## Mobile-first e densidade
- [x] Compactacao de KPI/cards/tabelas em breakpoints pequenos em styles/components.css
- [x] Ajuste de paddings e textos para 680px-
- [x] Tabela com leitura compacta em mobile (th/td menores)

## UX guiada por modulo
- [x] Proxima acao explicita em Dividas
- [x] Proxima acao explicita em Suporte
- [x] Proxima acao explicita em Documentos
- [x] Proxima acao explicita em Dashboard Financeiro
- [x] Proxima acao explicita em Jornada CNJ
- [x] Proxima acao explicita em Onboarding

## Responsividade e navegacao
- [x] Sidebar drawer mobile preservado no shell
- [x] CTA de proxima acao com empilhamento vertical em telas pequenas
- [x] Scroll horizontal para tabelas em telas pequenas

## Pendencias futuras (opcional)
- [ ] Executar auditoria visual manual em dispositivos reais (320px, 375px, 768px, 1024px)
- [ ] Capturar screenshots de regressao para baseline visual
- [ ] Definir regra de lint para bloquear novas fontes fora de Lucida/Arial
