# UI Kit — Recupera Empresas Design System

Componentes UI responsivos, mobile-first e alinhados ao branding oficial.

## 🎨 Branding

| Cor | Hex | Uso |
|-----|-----|-----|
| Azul Profundo (Primary) | `#1a3a5c` | Títulos, botões primários, headers |
| Azul Médio (Secondary) | `#2e6da4` | Elementos secundários, links |
| Dourado (Accent) | `#f5a623` | Destaques, CTAs, badges especiais |
| Cinza Grafite (Text) | `#0f172a` | Texto principal |

## 📱 Mobile-First

Todos os componentes são projetados primeiro para telas pequenas e escalonados para desktop:

- **Breakpoints**: 480px (xs), 768px (md), 1024px (lg)
- **Touch targets**: mínimo 44×44px (WCAG)
- **Fontes**: 16px em inputs para evitar zoom no iOS

## ♿ Acessibilidade (WCAG AA)

- Contraste adequado entre texto e fundo
- Navegação por teclado completa
- Suporte a leitores de tela (`ui-sr-only`)
- Focus states visíveis
- Skip links para navegação rápida
- Reduced motion support

## 🔧 Componentes

### Buttons
```html
<button class="ui-btn ui-btn-primary">Primário</button>
<button class="ui-btn ui-btn-secondary">Secundário</button>
<button class="ui-btn ui-btn-accent">Destaque</button>
<button class="ui-btn ui-btn-ghost">Fantasma</button>
<button class="ui-btn ui-btn-outline">Outline</button>
<button class="ui-btn ui-btn-danger">Perigo</button>
<button class="ui-btn ui-btn-icon" aria-label="Ação">📷</button>
```

### Form Fields
```html
<div class="ui-field">
  <label class="ui-label" for="nome">Nome</label>
  <input id="nome" class="ui-input" type="text" placeholder="Digite o nome" />
  <span class="ui-help">Campo obrigatório</span>
</div>
```

### Cards
```html
<div class="ui-card">
  <div class="ui-card-header">
    <h3 class="ui-card-title">Título do Card</h3>
  </div>
  <p class="ui-card-subtitle">Subtítulo opcional</p>
  <div class="ui-card-body">Conteúdo...</div>
</div>
```

### Badges
```html
<span class="ui-badge">Padrão</span>
<span class="ui-badge ui-badge-ok">Sucesso</span>
<span class="ui-badge ui-badge-warn">Atenção</span>
<span class="ui-badge ui-badge-danger">Erro</span>
<span class="ui-badge ui-badge-brand">Marca</span>
<span class="ui-badge ui-badge-secret">Segredo de Justiça</span>
```

### Tables
```html
<div class="ui-table-wrap">
  <table class="ui-table">
    <thead>
      <tr>
        <th>Coluna 1</th>
        <th>Coluna 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Dado 1</td>
        <td>Dado 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

## 📐 Variáveis CSS

### Cores
```css
--ui-brand-primary: #1a3a5c;
--ui-brand-secondary: #2e6da4;
--ui-brand-accent: #f5a623;
--ui-text: #0f172a;
--ui-ok: #1a7a4a;
--ui-warn: #b7791f;
--ui-danger: #c0392b;
```

### Espaçamento
```css
--ui-touch-min: 44px;
--ds-space-1: 4px;
--ds-space-2: 8px;
--ds-space-3: 12px;
--ds-space-4: 16px;
--ds-space-5: 20px;
--ds-space-6: 24px;
```

### Bordas e Sombras
```css
--ui-radius-sm: 6px;
--ui-radius-md: 8px;
--ui-radius-lg: 12px;
--ui-shadow-xs: 0 1px 3px rgba(15, 23, 42, 0.04);
--ui-shadow-sm: 0 2px 6px rgba(15, 23, 42, 0.06);
--ui-shadow-md: 0 4px 14px rgba(15, 23, 42, 0.08);
--ui-shadow-lg: 0 10px 24px rgba(15, 23, 42, 0.12);
```

## 🌗 Dark Mode

Automático via `[data-theme="dark"]` ou `.theme-dark`. Todas as cores possuem variantes escuras.

## 📚 Integração com Tailwind

O design system está integrado ao Tailwind CSS através do `tailwind.config.ts`:

```tsx
// Uso com classes utilitárias
<button className="bg-brand-primary text-white p-touch rounded-md">
  Clique aqui
</button>
```

## ✅ Checklist de Validação

- [ ] Funciona em mobile (≤480px)
- [ ] Funciona em tablet (768px)
- [ ] Funciona em desktop (≥1024px)
- [ ] Touch targets ≥44px
- [ ] Contraste WCAG AA
- [ ] Navegação por teclado
- [ ] Dark mode compatível
