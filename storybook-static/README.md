# Recupera Empresas Design System (v1.0)

Design System empresarial mobile-first, acessível e consistente com o branding da Recupera Empresas.

## ✨ Princípios Fundamentais

- **Mobile-First**: Componentes projetados para telas pequenas primeiro
- **Acessibilidade (WCAG AA)**: Contraste, navegação por teclado, leitores de tela
- **Touch-Friendly**: Área mínima de toque 44×44px
- **Branding Consistente**: Paleta oficial (Azul Profundo, Cinza Grafite, Dourado)
- **Responsivo**: Breakpoints bem definidos

## 📁 Estrutura

```
design-system/
├── tokens/           # Variáveis CSS (cores, tipografia, espaçamento)
│   └── core.css
├── components/       # Componentes base
│   ├── base.css      # Botões, inputs, cards, badges, etc.
│   └── registry.json # Registro de componentes
├── responsive/       # Sistema responsivo mobile-first
│   └── mobile-first.css
├── themes/           # Temas (light, dark)
│   └── light.css
├── typography/       # Classes tipográficas
│   └── typography.css
├── animations/       # Sistema de animações
│   └── animation-system.css
├── docs/             # Documentação
│   ├── UI-KIT-GUIDE.md
│   └── storybook-foundation.md
└── README.md         # Este arquivo
```

## 🚀 Quick Start

### Importação

```html
<link rel="stylesheet" href="/design-system/tokens/core.css" />
<link rel="stylesheet" href="/design-system/components/base.css" />
<link rel="stylesheet" href="/design-system/responsive/mobile-first.css" />
<link rel="stylesheet" href="/design-system/themes/light.css" />
```

### Uso Básico

```html
<button class="ds-btn ds-btn-primary">Salvar</button>
<input type="text" class="ds-input" placeholder="Digite..." />
<div class="ds-card">Conteúdo do card</div>
<span class="ds-badge ds-badge-success">Ativo</span>
```

## 🎨 Tokens Principais

### Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-color-brand-700` | #2e6da4 | Brand principal |
| `--ds-color-accent-500` | #f5a623 | Acento/dourado |
| `--ds-color-ink-900` | #0f1923 | Texto principal |

### Espaçamento (Base 4px)

| Token | Valor |
|-------|-------|
| `--ds-space-2` | 8px |
| `--ds-space-4` | 16px |
| `--ds-space-6` | 24px |

### Breakpoints

| Token | Valor |
|-------|-------|
| `--ds-breakpoint-sm` | 480px |
| `--ds-breakpoint-md` | 768px |
| `--ds-breakpoint-lg` | 1024px |

## 📱 Responsividade

O sistema usa abordagem mobile-first com breakpoints progressivos:

- **Mobile (<768px)**: Layouts de coluna única, botões full-width
- **Tablet (≥768px)**: Grids de 2-3 colunas, modais centralizados
- **Desktop (≥1024px)**: Layouts multi-coluna, containers máximos

## ♿ Acessibilidade

- Focus states visíveis (`:focus-visible`)
- Suporte a `prefers-reduced-motion`
- Suporte a `prefers-contrast: high`
- Touch targets ≥ 44px
- Contraste WCAG AA

## 📖 Documentação

- [UI Kit Guide](docs/UI-KIT-GUIDE.md) - Guia completo de uso
- [Storybook Foundation](docs/storybook-foundation.md) - Padrões para stories

## 🔧 Componentes Disponíveis

| Componente | Classes | Descrição |
|------------|---------|-----------|
| Button | `.ds-btn`, `.ds-btn-primary`, `.ds-btn-secondary` | Botões com variantes |
| Input | `.ds-input`, `.ds-select`, `.ds-textarea` | Controles de formulário |
| Card | `.ds-card`, `.ds-card-elevated` | Containers de conteúdo |
| Badge | `.ds-badge`, `.ds-badge-success` | Etiquetas de status |
| Typography | `.ds-h1`, `.ds-body`, `.ds-caption` | Classes tipográficas |
| Skeleton | `.ds-skeleton` | Loading states |

## ✅ Validação

Checklist de implementação:

- [x] Mobile (320px+)
- [x] Tablet (768px+)
- [x] Desktop (1024px+)
- [x] Touch targets ≥ 44px
- [x] Contraste WCAG AA
- [x] Navegação por teclado
- [x] Focus states visíveis
- [x] Suporte reduced-motion
- [x] Suporte high-contrast
- [x] Branding consistente

## 📋 Versão

**Versão:** 1.0.0  
**Última atualização:** 2026-05-23  
**Manutenção:** UI Refactor Agent

---

© 2026 Recupera Empresas. Todos os direitos reservados.
