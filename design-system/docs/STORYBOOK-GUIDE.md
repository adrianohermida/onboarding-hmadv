# 📘 Storybook - Design System Recupera Empresas

Guia completo de configuração e uso do Storybook para o Design System.

## 📋 Índice

- [Instalação](#instalação)
- [Comandos](#comandos)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Criando Stories](#criando-stories)
- [Viewports Mobile-First](#viewports-mobile-first)
- [Acessibilidade](#acessibilidade)
- [Deploy no GitHub Pages](#deploy-no-github-pages)
- [Visual Regression Testing](#visual-regression-testing)

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm 10+

### Instalar Dependências

```bash
# No diretório raiz do projeto
npm install --legacy-peer-deps
```

### Dependências Instaladas

```json
{
  "devDependencies": {
    "@storybook/html": "^8.6.14",
    "@storybook/addon-essentials": "^8.6.14",
    "@storybook/addon-a11y": "^8.6.14",
    "@storybook/addon-viewport": "^8.6.14",
    "storybook": "^8.6.14"
  }
}
```

---

## 📦 Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run storybook` | Inicia o Storybook em `http://localhost:6006` |
| `npm run build-storybook` | Build estático para produção |
| `npm run deploy-storybook` | Deploy automático no GitHub Pages |

---

## 📁 Estrutura de Arquivos

```
/workspace
├── .storybook/
│   ├── main.ts          # Configuração principal
│   └── preview.ts       # Preview global (decorators, parameters)
├── design-system/
│   ├── tokens/
│   │   └── core-v2.css  # Tokens de design
│   ├── components/
│   │   └── base-v2.css  # Componentes CSS
│   ├── patterns/
│   │   └── pwa.css      # Padrões PWA
│   └── stories/
│       ├── Button.stories.ts
│       ├── Card.stories.ts
│       └── Input.stories.ts
└── package.json
```

---

## ✍️ Criando Stories

### Template Básico

```typescript
// design-system/stories/MyComponent.stories.ts
import type { Meta, StoryObj } from '@storybook/html';
import '../tokens/core-v2.css';
import '../components/base-v2.css';

const meta = {
  title: 'Componentes/MeuComponente',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Story simples
export const Default: Story = {
  args: {
    children: 'Conteúdo do componente',
  },
};

// Story com render customizado
export const Custom: Story = {
  render: (args) => `
    <div class="my-component my-component-${args.variant}">
      ${args.children}
    </div>
  `,
};
```

### JSDoc para Documentação

Use comentários JSDoc para documentar cada story:

```typescript
/**
 * ### Variante Primária
 * 
 * Use para ações principais da interface.
 * 
 * @example
 * <button class="ds-btn ds-btn-primary">Clique aqui</button>
 */
export const Primary: Story = {
  args: { variant: 'primary' },
};
```

---

## 📱 Viewports Mobile-First

O Storybook está configurado com viewports responsivos:

| Nome | Resolução | Tipo |
|------|-----------|------|
| Mobile Small | 320×568 | iPhone SE |
| Mobile Medium | 375×667 | iPhone 8 |
| Mobile Large | 414×896 | iPhone 11 Pro Max |
| Tablet | 768×1024 | iPad |
| Desktop Small | 1024×768 | Laptop |
| Desktop Medium | 1280×800 | Desktop |
| Desktop Large | 1536×864 | Desktop Grande |

### Testando Responsividade

1. Abra o Storybook
2. Clique no ícone de **Viewport** na toolbar
3. Selecione diferentes dispositivos
4. Verifique se o componente se adapta corretamente

### Breakpoints do Design System

```css
/* Mobile First - Base (320px+) */
.ds-component { /* styles mobile */ }

/* Tablet (768px+) */
@media (min-width: 768px) {
  .ds-component { /* styles tablet */ }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .ds-component { /* styles desktop */ }
}

/* Desktop Large (1280px+) */
@media (min-width: 1280px) {
  .ds-component { /* styles desktop large */ }
}
```

---

## ♿ Acessibilidade

### Addon A11y

O addon de acessibilidade verifica automaticamente:

- Contraste de cores (WCAG AA)
- Alt text em imagens
- Labels em inputs
- Nomes em links
- Focus states
- ARIA attributes

### Rodando Testes de Acessibilidade

1. Abra uma story
2. Clique na aba **Accessibility** no painel inferior
3. Corrija quaisquer violações reportadas

### Boas Práticas

```typescript
// ✅ SEMPRE use aria-label em botões sem texto
<button class="ds-btn-icon" aria-label="Fechar modal">
  <svg><!-- ícone --></svg>
</button>

// ✅ SEMPRE associe labels a inputs
<label for="email">E-mail</label>
<input type="email" id="email" />

// ✅ Use role e tabindex em elementos interativos customizados
<div role="button" tabindex="0" aria-pressed="false">
  Toggle
</div>
```

---

## 🚀 Deploy no GitHub Pages

### Configuração Automática

O workflow `.github/workflows/deploy-storybook.yml` faz deploy automático:

```yaml
name: Deploy Storybook

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install --legacy-peer-deps
      - run: npm run build-storybook
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```

### Acessando o Storybook Publicado

Após o deploy, acesse:
```
https://adrianohermida.github.io/onboarding-hmadv/
```

### Deploy Manual

```bash
# Build
npm run build-storybook

# Deploy (requer gh-pages instalado)
npx gh-pages -d storybook-static
```

---

## 🔍 Visual Regression Testing

### Chromatic (Recomendado)

[Chromatic](https://www.chromatic.com/) é a plataforma oficial para visual regression testing do Storybook.

#### Configuração

```bash
# Instale o Chromatic
npm install -D chromatic

# Execute o Chromatic
npx chromatic --project-token=SEU_PROJECT_TOKEN
```

#### Integração com GitHub Actions

```yaml
# .github/workflows/chromatic.yml
name: 'Chromatic'

on: push

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: npm install --legacy-peer-deps
      - uses: chromaui/action@v11
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

#### Benefícios

- ✅ Detecção automática de mudanças visuais
- ✅ Aprovação/rejeição de changes
- ✅ Snapshot testing por viewport
- ✅ Integração com PRs do GitHub
- ✅ Histórico visual de componentes

### Alternativa: Loki

[Loki](https://loki.js.org/) é uma alternativa open-source:

```bash
npm install -D loki

# Configurar no package.json
{
  "scripts": {
    "loki:test": "loki test",
    "loki:update": "loki update"
  },
  "loki": {
    "configurations": {
      "chrome.mobile": {
        "target": "chrome.docker",
        "width": 375,
        "height": 667,
        "deviceScaleFactor": 2,
        "mobileEmulation": true
      },
      "chrome.desktop": {
        "target": "chrome.docker",
        "width": 1920,
        "height": 1080
      }
    }
  }
}
```

---

## 🎨 Adicionando Novos Componentes

### Checklist

- [ ] Criar arquivo `.stories.ts` no padrão
- [ ] Documentar com JSDoc
- [ ] Testar em todos os viewports
- [ ] Verificar acessibilidade (aba Accessibility)
- [ ] Adicionar variantes (tamanhos, estados, etc.)
- [ ] Testar dark mode
- [ ] Commitar e fazer push

### Exemplo Completo

```typescript
// design-system/stories/Tooltip.stories.ts
import type { Meta, StoryObj } from '@storybook/html';
import '../tokens/core-v2.css';
import '../components/base-v2.css';

/**
 * ## Tooltips
 * 
 * Dicas contextuais que aparecem ao hover/focus.
 * 
 * **Guidelines:**
 * - Mobile: aparece no tap, desaparece no tap fora
 * - Desktop: aparece no hover, desaparece no mouseleave
 * - Acessibilidade: sempre use aria-describedby
 */

const meta = {
  title: 'Componentes/Tooltip',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
    },
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
  },
  args: {
    position: 'top',
    variant: 'default',
    content: 'Esta é uma dica útil',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => `
    <div style="display: inline-block;">
      <button 
        class="ds-btn ds-btn-primary"
        aria-describedby="tooltip-1"
      >
        Passe o mouse
      </button>
      <div 
        id="tooltip-1" 
        class="ds-tooltip ds-tooltip-${args.position} ds-tooltip-${args.variant}"
        role="tooltip"
      >
        ${args.content}
      </div>
    </div>
  `,
};
```

---

## 📊 Métricas e Analytics

### Storybook Stats

Adicione o addon `@storybook/addon-stats` para ver métricas:

```bash
npm install -D @storybook/addon-stats
```

### Coverage de Componentes

Mantenha um registro de componentes implementados:

```markdown
## Componentes Implementados

- [x] Botões (5 variantes, 4 tamanhos)
- [x] Cards (4 variantes, 3 tamanhos)
- [x] Inputs (7 tipos, 3 tamanhos)
- [ ] Modal
- [ ] Toast
- [ ] Dropdown
- [ ] Tabs
```

---

## 🐛 Troubleshooting

### Erro: "Could not resolve dependency"

```bash
# Use legacy-peer-deps
npm install --legacy-peer-deps
```

### Storybook não carrega CSS

Verifique os imports no `preview.ts`:

```typescript
import '../design-system/tokens/core-v2.css';
import '../design-system/components/base-v2.css';
```

### Viewports não aparecem

Certifique-se de que o addon está configurado no `main.ts`:

```typescript
addons: [
  '@storybook/addon-viewport',
]
```

---

## 📚 Recursos Adicionais

- [Documentação Oficial do Storybook](https://storybook.js.org/docs)
- [Addon Essentials](https://storybook.js.org/addons/@storybook/addon-essentials)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mobile UI Patterns](https://pttrns.com/)

---

**Última atualização:** Maio 2026  
**Versão do Storybook:** 8.6.14  
**Design System:** v2.0
