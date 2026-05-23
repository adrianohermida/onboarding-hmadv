# Storybook Foundation - Recupera Empresas Design System

Este documento estabelece os fundamentos para a implementação do Storybook no Design System da Recupera Empresas.

## 📋 Visão Geral

O Storybook será utilizado para:
- Documentar visualmente todos os componentes
- Demonstrar comportamentos em diferentes resoluções (mobile, tablet, desktop)
- Facilitar o desenvolvimento e teste isolado de componentes
- Servir como referência para designers e desenvolvedores

## 🏗️ Arquitetura Proposta

```
design-system/
├── storybook/
│   ├── .storybook/
│   │   ├── main.js          # Configuração principal
│   │   ├── preview.js       # Configuração global (decorators, parameters)
│   │   ├── manager.js       # Customização do painel lateral
│   │   └── theme.js         # Tema customizado Recupera Empresas
│   ├── stories/
│   │   ├── components/
│   │   │   ├── Button.stories.js
│   │   │   ├── Input.stories.js
│   │   │   ├── Modal.stories.js
│   │   │   ├── Slideover.stories.js
│   │   │   ├── Tabs.stories.js
│   │   │   └── Dropdown.stories.js
│   │   ├── patterns/
│   │   │   ├── Dashboard.stories.js
│   │   │   └── Forms.stories.js
│   │   └── tokens/
│   │       ├── Colors.stories.js
│   │       ├── Typography.stories.js
│   │       └── Spacing.stories.js
│   └── public/
│       └── assets/
├── tokens/
├── components/
└── themes/
```

## 📦 Instalação

```bash
npm install -D @storybook/html @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-viewport @storybook/addon-docs @storybook/addon-controls
```

## ⚙️ Configuração Principal

### `.storybook/main.js`

```javascript
import { dirname, join } from 'path';

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-viewport'),
    getAbsolutePath('@storybook/addon-controls'),
    getAbsolutePath('@storybook/addon-docs')
  ],
  framework: {
    name: getAbsolutePath('@storybook/html-vite'),
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  staticDirs: ['../public/assets']
};

export default config;

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')));
}
```

### `.storybook/preview.js`

```javascript
import '../tokens/core.css';
import '../themes/light.css';
import '../themes/dark.css';
import '../components/base.css';
import '../responsive/mobile-first.css';

/** @type { import('@storybook/html').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobileSmall: {
          name: 'Mobile Small',
          styles: {
            width: '320px',
            height: '568px',
          },
        },
        mobileMedium: {
          name: 'Mobile Medium',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
      },
    },
    a11y: {
      element: '#root',
      config: {},
      options: {},
    },
    docs: {
      theme: {
        brandTitle: 'Recupera Empresas Design System',
        brandUrl: 'https://github.com/recupera-empresas',
        brandImage: '/assets/logo.svg',
        brandTarget: '_self',
      },
    },
  },
  decorators: [
    (story) => `
      <div class="sb-story-wrapper">
        ${story()}
      </div>
    `,
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', left: '☀️' },
          { value: 'dark', title: 'Dark', left: '🌙' },
        ],
      },
    },
  },
};

export default preview;
```

## 📖 Exemplo de Story

### `stories/components/Button.stories.js`

```javascript
import './button.css';

export default {
  title: 'Components/Button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    loading: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
  },
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'mobileMedium',
    },
  },
};

const Template = ({ variant = 'primary', size = 'md', disabled = false, loading = false, children = 'Button' }) => {
  const button = document.createElement('button');
  button.className = `btn btn-${variant} btn-${size}`;
  button.disabled = disabled || loading;
  
  if (loading) {
    button.classList.add('btn-loading');
    button.setAttribute('aria-busy', 'true');
  }
  
  button.textContent = children;
  return button;
};

export const Primary = Template.bind({});
Primary.args = {
  variant: 'primary',
  children: 'Primary Button',
};

export const Secondary = Template.bind({});
Secondary.args = {
  variant: 'secondary',
  children: 'Secondary Button',
};

export const Outline = Template.bind({});
Outline.args = {
  variant: 'outline',
  children: 'Outline Button',
};

export const Ghost = Template.bind({});
Ghost.args = {
  variant: 'ghost',
  children: 'Ghost Button',
};

export const Danger = Template.bind({});
Danger.args = {
  variant: 'danger',
  children: 'Danger Button',
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
  children: 'Disabled Button',
};

export const Loading = Template.bind({});
Loading.args = {
  loading: true,
  children: 'Loading...',
};

// Responsividade
export const MobileView = Template.bind({});
MobileView.args = {
  variant: 'primary',
  children: 'Mobile Button',
};
MobileView.parameters = {
  viewport: {
    defaultViewport: 'mobileSmall',
  },
};

export const DesktopView = Template.bind({});
DesktopView.args = {
  variant: 'primary',
  children: 'Desktop Button',
};
DesktopView.parameters = {
  viewport: {
    defaultViewport: 'desktop',
  },
};
```

## 🎨 Stories por Categoria

### Components (Prioridade 1)
- ✅ Button
- ✅ Input
- ✅ Select
- ✅ Checkbox
- ✅ Radio
- ✅ Toggle/Switch
- ✅ Modal
- ✅ Slideover
- ✅ Tabs
- ✅ Dropdown
- ✅ Card
- ✅ Badge
- ✅ Avatar
- ✅ Tooltip
- ✅ Toast/Alert

### Patterns (Prioridade 2)
- Dashboard Cards
- Data Tables
- Form Layouts
- Navigation Menus
- Search Filters
- Empty States
- Loading States

### Tokens (Prioridade 3)
- Color Palette
- Typography Scale
- Spacing System
- Border Radius
- Shadows
- Z-Index

## 🔧 Scripts NPM

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "preview-storybook": "npx serve storybook-static"
  }
}
```

## 🚀 Deploy

### GitHub Pages

```bash
npm run build-storybook
npx gh-pages -d storybook-static
```

### Vercel/Netlify

Configurar build:
- **Build command:** `npm run build-storybook`
- **Output directory:** `storybook-static`

## 📊 Métricas de Qualidade

- ✅ Todos os componentes têm stories básicos
- ✅ Componentes críticos têm stories de responsividade (mobile/tablet/desktop)
- ✅ Acessibilidade verificada com addon-a11y
- ✅ Documentação completa com args e controls
- ✅ Visual tests com Chromatic (opcional)

## 🎯 Próximos Passos

1. **Fase 1:** Implementar stories dos componentes base (Button, Input, Card)
2. **Fase 2:** Adicionar stories dos componentes complexos (Modal, Slideover, Tabs, Dropdown)
3. **Fase 3:** Criar stories de patterns e layouts
4. **Fase 4:** Implementar visual regression testing com Chromatic
5. **Fase 5:** Deploy automatizado no CI/CD

## 📚 Referências

- [Storybook Official Docs](https://storybook.js.org/docs)
- [Storybook Addons](https://storybook.js.org/addons)
- [Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Viewport Addon](https://storybook.js.org/addons/@storybook/addon-viewport)
