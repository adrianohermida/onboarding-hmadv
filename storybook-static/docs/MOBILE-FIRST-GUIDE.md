# 📱 Design System v2.0 - Guia de Implementação Mobile-First

## Visão Geral

O **Design System Recupera Empresas v2.0** foi completamente reformulado com foco em:

- ✅ **Mobile-First**: Projetado para telas pequenas (320px) e escalonado progressivamente
- ✅ **Android/iOS Guidelines**: Segue Material Design 3 e Human Interface Guidelines
- ✅ **PWA Offline-Ready**: Suporte completo para Progressive Web Apps
- ✅ **Acessibilidade WCAG 2.1 AA**: Contraste, navegação por teclado, leitores de tela
- ✅ **Branding Consistente**: Paleta oficial (Azul Profundo, Cinza Grafite, Dourado)

---

## 🎨 Tokens de Design

### Cores da Marca

| Token | Valor | Uso |
|-------|-------|-----|
| `--ds-color-brand-900` | `#1a3a5c` | Azul Profundo (primário escuro) |
| `--ds-color-brand-700` | `#2e6da4` | Azul Principal (botões, links) |
| `--ds-color-brand-500` | `#4f8ec8` | Azul Claro (hover, focus) |
| `--ds-color-accent-500` | `#f5a623` | Dourado (acentos, destaques) |

### Escala de Neutros

```css
--ds-color-neutral-900: #0f1923;  /* Texto primário */
--ds-color-neutral-700: #263544;  /* Texto secundário */
--ds-color-neutral-500: #52657a;  /* Texto terciário */
--ds-color-neutral-300: #7d8fa3;  /* Bordas */
--ds-color-neutral-100: #cbd5e1;  /* Fundos sutis */
```

### Touch Targets (Acessibilidade)

| Plataforma | Mínimo | Recomendado |
|------------|--------|-------------|
| Android | 48x48dp | 56x56dp |
| iOS | 44x44pt | 48x48pt |

```css
--ds-touch-target-min: 48px;  /* Padrão Android */
--ds-touch-target-sm: 44px;   /* Mínimo iOS */
--ds-touch-target-lg: 56px;   /* Confortável */
```

---

## 📐 Breakpoints Mobile-First

```css
/* Mobile First - comece pelo menor */
--ds-breakpoint-xs: 320px;   /* Phones pequenos */
--ds-breakpoint-sm: 480px;   /* Phones grandes */
--ds-breakpoint-md: 768px;   /* Tablets */
--ds-breakpoint-lg: 1024px;  /* Laptops pequenos */
--ds-breakpoint-xl: 1280px;  /* Desktops */
--ds-breakpoint-2xl: 1536px; /* Desktops grandes */
```

### Exemplo de Uso

```css
/* Base: mobile (320px+) */
.ds-card {
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-card-mobile);
}

/* Tablet+ (768px+) */
@media (min-width: 768px) {
  .ds-card {
    padding: var(--ds-space-6);
    border-radius: var(--ds-radius-card-desktop);
  }
}

/* Desktop+ (1024px+) */
@media (min-width: 1024px) {
  .ds-card {
    padding: var(--ds-space-8);
  }
}
```

---

## 🔧 Componentes Principais

### Botões

```html
<!-- Botão Primário -->
<button class="ds-btn ds-btn-primary">
  Salvar Alterações
</button>

<!-- Botão Secundário -->
<button class="ds-btn ds-btn-secondary">
  Cancelar
</button>

<!-- Botão com ícone -->
<button class="ds-btn ds-btn-primary">
  <svg class="ds-icon" width="20" height="20">...</svg>
  Adicionar Cliente
</button>

<!-- Full width em mobile -->
<button class="ds-btn ds-btn-primary ds-btn-block-mobile">
  Confirmar Pagamento
</button>
```

### Inputs

```html
<div class="ds-input-wrapper">
  <label class="ds-label ds-label-required">E-mail</label>
  <input 
    type="email" 
    class="ds-input" 
    placeholder="cliente@empresa.com.br"
    required
  />
  <span class="ds-error-message">
    <svg width="16" height="16">...</svg>
    E-mail inválido
  </span>
</div>
```

### Cards Responsivos

```html
<article class="ds-card ds-card-elevated">
  <header class="ds-card-header">
    <h3 class="ds-heading-4">Processo Judicial</h3>
    <span class="ds-badge ds-badge-warning">Em Andamento</span>
  </header>
  <div class="ds-card-body">
    <p class="ds-body">Número: 0012345-67.2024.8.26.0100</p>
    <p class="ds-body-small">Última atualização: há 2 horas</p>
  </div>
  <footer class="ds-card-footer">
    <button class="ds-btn ds-btn-sm ds-btn-secondary">Ver Detalhes</button>
  </footer>
</article>
```

### Badges & Chips

```html
<!-- Badge estático -->
<span class="ds-badge ds-badge-success">Aprovado</span>
<span class="ds-badge ds-badge-danger">Vencido</span>

<!-- Chip interativo -->
<button class="ds-chip ds-chip-selected">
  <span>Filtrar por Ativos</span>
  <button class="ds-chip-remove" aria-label="Remover filtro">×</button>
</button>
```

---

## 🌙 Dark Mode Automático

O sistema detecta automaticamente a preferência do usuário:

```css
/* Funciona automaticamente via media query */
@media (prefers-color-scheme: dark) {
  /* Cores ajustadas automaticamente */
  --ds-color-surface-0: #0f1923;
  --ds-color-text-primary: #f1f5f9;
  /* ... */
}
```

### Toggle Manual (Opcional)

```html
<button class="ds-btn ds-btn-tertiary" id="theme-toggle" aria-label="Alternar tema">
  <svg class="sun-icon" width="20" height="20">...</svg>
  <svg class="moon-icon" width="20" height="20" hidden>...</svg>
</button>

<script>
  const toggle = document.getElementById('theme-toggle');
  toggle.addEventListener('click', () => {
    document.documentElement.setAttribute(
      'data-theme',
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    );
  });
</script>
```

---

## ♿ Acessibilidade (WCAG 2.1 AA)

### Focus States

Todos os elementos focáveis têm estados visíveis:

```css
.ds-focusable:focus-visible {
  outline: var(--ds-focus-ring);
  outline-offset: var(--ds-focus-ring-offset);
}
```

### Reduced Motion

Respeita preferências de movimento reduzido:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast

Suporte a modo de alto contraste:

```css
@media (prefers-contrast: high) {
  :root {
    --ds-color-border-default: #0f1923;
    --ds-focus-ring-width: 4px;
  }
}
```

---

## 📲 PWA Offline Support

### Network Status Indicator

```html
<div class="ds-network-status" id="network-status">
  Você está offline. Algumas funcionalidades podem estar limitadas.
</div>

<script>
  window.addEventListener('online', () => {
    document.getElementById('network-status').classList.add('visible', 'online');
    setTimeout(() => {
      document.getElementById('network-status').classList.remove('visible', 'online');
    }, 3000);
  });
  
  window.addEventListener('offline', () => {
    document.getElementById('network-status').classList.add('visible', 'offline');
  });
</script>
```

### Offline Page Fallback

```html
<div class="ds-offline-page" hidden id="offline-page">
  <svg class="ds-offline-icon">...</svg>
  <h1 class="ds-heading-2 ds-offline-title">Você está offline</h1>
  <p class="ds-offline-description">
    Não foi possível conectar à internet. Verifique sua conexão e tente novamente.
  </p>
  <div class="ds-offline-actions">
    <button class="ds-btn ds-btn-primary" onclick="location.reload()">
      Tentar Novamente
    </button>
    <button class="ds-btn ds-btn-secondary">
      Ver Conteúdo Cacheado
    </button>
  </div>
</div>
```

---

## 📱 Platform-Specific Patterns

### Android (Material Design 3)

- Botões: `border-radius: 8px`
- Cards: Elevação com sombras suaves
- Navegação: Bottom app bar em mobile

### iOS (Human Interface Guidelines)

- Botões: `border-radius: 12px`
- Cards: Cantos mais arredondados (`16px`)
- Navegação: Tab bar nativa

### Detecção de Plataforma

```css
/* Ajustes específicos por plataforma via JS */
@media (hover: none) and (pointer: coarse) {
  /* Dispositivos touch-only */
  .ds-btn {
    min-height: var(--ds-touch-target-lg);
  }
}
```

---

## 🚀 Quick Start

### 1. Importar CSS

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#2e6da4">
  <title>Recupera Empresas</title>
  
  <!-- Design System Core -->
  <link rel="stylesheet" href="/design-system/tokens/core-v2.css">
  <link rel="stylesheet" href="/design-system/components/base-v2.css">
  <link rel="stylesheet" href="/design-system/patterns/pwa.css">
</head>
<body>
  <!-- Seu conteúdo aqui -->
</body>
</html>
```

### 2. Usar Componentes

```html
<!-- Exemplo completo -->
<main class="ds-safe-area-top ds-safe-area-bottom">
  <header style="padding: var(--ds-space-4);">
    <h1 class="ds-heading-2">Dashboard</h1>
  </header>
  
  <section style="padding: var(--ds-space-4); display: grid; gap: var(--ds-space-4);">
    <article class="ds-card">
      <div class="ds-card-body">
        <h2 class="ds-heading-4">Clientes Ativos</h2>
        <p class="ds-heading-1" style="color: var(--ds-color-brand-700);">24</p>
        <span class="ds-badge ds-badge-success">+12% este mês</span>
      </div>
    </article>
    
    <button class="ds-btn ds-btn-primary ds-btn-block-mobile">
      Novo Cliente
    </button>
  </section>
</main>
```

---

## 📊 Checklist de Validação

### Mobile (320px - 480px)
- [ ] Touch targets ≥ 44x44px
- [ ] Texto legível sem zoom
- [ ] Sem overflow horizontal
- [ ] Botões full-width quando necessário
- [ ] Safe areas respeitadas (notch)

### Tablet (768px - 1024px)
- [ ] Grid adaptado (2-3 colunas)
- [ ] Cards com padding aumentado
- [ ] Navegação otimizada

### Desktop (1280px+)
- [ ] Layout multi-coluna
- [ ] Hover states visíveis
- [ ] Tipografia escalada

### Acessibilidade
- [ ] Contraste ≥ 4.5:1 (texto normal)
- [ ] Focus states visíveis
- [ ] Navegação por teclado funcional
- [ ] ARIA labels em ícones

### PWA
- [ ] Network status indicator
- [ ] Offline fallback page
- [ ] Service worker registrado
- [ ] Install prompt estilizado

---

## 📚 Recursos Adicionais

- [Material Design 3 Guidelines](https://m3.material.io/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [WCAG 2.1 Checklist](https://www.w3.org/WAI/WCAG21/quickref/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**Versão:** 2.0.0  
**Última atualização:** Maio 2026  
**Manutenção:** Equipe Recupera Empresas
