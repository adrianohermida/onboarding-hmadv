# Recupera Empresas Design System - UI Kit Guide

## Visão Geral

Design System mobile-first, acessível e consistente com o branding da Recupera Empresas.

## Princípios Fundamentais

1. **Mobile-First**: Todos os componentes são projetados para telas pequenas primeiro
2. **Acessibilidade (WCAG AA)**: Contraste adequado, navegação por teclado, suporte a leitores de tela
3. **Touch-Friendly**: Área mínima de toque 44×44px
4. **Branding Consistente**: Paleta oficial aplicada uniformemente
5. **Responsivo**: Breakpoints bem definidos (480px, 768px, 1024px, 1280px, 1536px)

## Tokens de Design

### Cores Oficiais

#### Azul Profundo (Brand)
```css
--ds-color-brand-900: #1a3a5c;  /* Principal */
--ds-color-brand-700: #2e6da4;
--ds-color-brand-500: #4f8ec8;  /* Hover */
```

#### Cinza Grafite (Texto)
```css
--ds-color-ink-900: #0f1923;  /* Texto principal */
--ds-color-ink-700: #3d4f63;  /* Texto secundário */
--ds-color-ink-500: #64748b;  /* Texto muted */
```

#### Dourado (Acento)
```css
--ds-color-accent-500: #f5a623;  /* Principal */
--ds-color-accent-400: #f7b946;  /* Hover */
```

### Tipografia Fluida

```css
/* Mobile → Desktop */
--ds-font-size-xs: clamp(0.6875rem, 0.65rem + 0.2vw, 0.75rem);
--ds-font-size-md: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
--ds-font-size-xl: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);
```

## Componentes

### Botões

```html
<!-- Primary -->
<button class="ds-btn ds-btn-primary">Salvar</button>

<!-- Secondary -->
<button class="ds-btn ds-btn-secondary">Cancelar</button>

<!-- Sizes -->
<button class="ds-btn ds-btn-primary ds-btn-sm">Pequeno</button>
<button class="ds-btn ds-btn-primary ds-btn-lg">Grande</button>

<!-- Full width (mobile) -->
<button class="ds-btn ds-btn-primary ds-btn-full">Largura Total</button>
```

**Características:**
- Min-height: 44px (touch target)
- Estados: hover, active, disabled, focus-visible
- Acessível via teclado

### Inputs

```html
<input type="text" class="ds-input" placeholder="Digite..." />

<!-- Sizes -->
<input type="text" class="ds-input ds-input-sm" />
<input type="text" class="ds-input ds-input-lg" />

<!-- States -->
<input type="text" class="ds-input ds-input-error" aria-invalid="true" />
<input type="text" class="ds-input ds-input-success" />
```

### Cards

```html
<div class="ds-card">
  <h3 class="ds-h4">Título</h3>
  <p class="ds-body">Conteúdo do card</p>
</div>

<!-- Elevated -->
<div class="ds-card ds-card-elevated">...</div>

<!-- Interactive -->
<div class="ds-card ds-card-interactive" role="button" tabindex="0">...</div>
```

### Badges

```html
<span class="ds-badge ds-badge-success">Ativo</span>
<span class="ds-badge ds-badge-warning">Pendente</span>
<span class="ds-badge ds-badge-danger">Inativo</span>
```

## Responsividade

### Breakpoints

| Nome | Valor | Uso |
|------|-------|-----|
| sm | 480px | Phones pequenos (landscape) |
| md | 768px | Tablets, phones grandes |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Telas grandes |

### Grid System

```html
<!-- 2 colunas em tablet, 3 em laptop, 4 em desktop -->
<div class="ds-grid">
  <div class="ds-card">Card 1</div>
  <div class="ds-card">Card 2</div>
  <div class="ds-card">Card 3</div>
</div>
```

## Acessibilidade

### Foco Visível

Todos os componentes interativos têm foco visível:
```css
.ds-btn:focus-visible {
  outline: 2px solid var(--ds-focus-ring-color);
  outline-offset: 2px;
}
```

### Alto Contraste

Suporte a `prefers-contrast: high`:
```css
@media (prefers-contrast: high) {
  .ds-btn-primary { border: 2px solid currentColor; }
}
```

### Movimento Reduzido

Suporte a `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

## Como Usar

### Importação

```html
<link rel="stylesheet" href="/design-system/tokens/core.css" />
<link rel="stylesheet" href="/design-system/components/base.css" />
<link rel="stylesheet" href="/design-system/responsive/mobile-first.css" />
<link rel="stylesheet" href="/design-system/themes/light.css" />
```

### Exemplo Completo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recupera Empresas</title>
  
  <!-- Design System -->
  <link rel="stylesheet" href="/design-system/tokens/core.css" />
  <link rel="stylesheet" href="/design-system/components/base.css" />
  <link rel="stylesheet" href="/design-system/responsive/mobile-first.css" />
  <link rel="stylesheet" href="/design-system/themes/light.css" />
</head>
<body class="theme-light">
  <main class="ds-safe-area">
    <h1 class="ds-h1">Bem-vindo</h1>
    
    <div class="ds-grid">
      <div class="ds-card">
        <h2 class="ds-h3">Card Título</h2>
        <p class="ds-body">Descrição do conteúdo.</p>
        <button class="ds-btn ds-btn-primary ds-btn-full">Ação</button>
      </div>
    </div>
  </main>
</body>
</html>
```

## Validação

### Checklist de Implementação

- [ ] Funciona em mobile (320px+)
- [ ] Funciona em tablet (768px+)
- [ ] Funciona em desktop (1024px+)
- [ ] Touch targets ≥ 44px
- [ ] Contraste WCAG AA
- [ ] Navegação por teclado
- [ ] Focus states visíveis
- [ ] Suporte a reduced-motion
- [ ] Suporte a high-contrast
- [ ] Branding consistente

## Próximos Passos

1. Criar Storybook com stories para cada componente
2. Implementar tema dark mode
3. Adicionar mais componentes (Modal, Slideover, Tabs, etc.)
4. Criar testes de regressão visual

---

**Versão:** 1.0.0  
**Última atualização:** 2026-05-23  
**Manutenção:** UI Refactor Agent
