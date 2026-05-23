import type { Preview } from '@storybook/html';

// Importar tokens e componentes do Design System
import '../design-system/tokens/core-v2.css';
import '../design-system/components/base-v2.css';
import '../design-system/patterns/pwa.css';

// Keep old and prefixed deep links working during cache rollout windows.
if (typeof window !== 'undefined') {
  const url = new URL(window.location.href);
  const storyId = url.searchParams.get('id');

  if (storyId) {
    let normalizedId = storyId;

    if (storyId.startsWith('componentes-botões--')) {
      normalizedId = storyId.replace('componentes-botões--', 'design-system-componentes-botões--');
    }

    if (storyId.startsWith('componentes-botoes--')) {
      normalizedId = storyId.replace('componentes-botoes--', 'design-system-componentes-botões--');
    }

    if (normalizedId !== storyId) {
      url.searchParams.set('id', normalizedId);
      window.history.replaceState({}, '', url.toString());
    }
  }
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    
    // Viewports padrão para mobile-first
    viewport: {
      defaultViewport: 'mobile-small',
    },
    
    // Acessibilidade - WCAG 2.1 AA
    a11y: {
      element: '#root',
      config: {},
      options: {
        checks: {
          'color-contrast': { enabled: true },
          'image-alt': { enabled: true },
          'label': { enabled: true },
          'link-name': { enabled: true },
        },
      },
    },
    
    // Documentação
    docs: {
      description: {
        component: 'Componentes do Design System Recupera Empresas - Mobile First com acessibilidade WCAG AA',
      },
    },
    
    // Layout
    layout: 'padded',
    
    // Backgrounds para testar contraste
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f1923',
        },
        {
          name: 'brand-primary',
          value: '#1a3a5c',
        },
        {
          name: 'brand-accent',
          value: '#f5a623',
        },
      ],
    },
  },
  
  // Decorators globais
  decorators: [
    (Story) => `
      <div class="ds-story-wrapper">
        <style>
          .ds-story-wrapper {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            padding: 1rem;
          }
          
          /* Suporte a dark mode automático */
          @media (prefers-color-scheme: dark) {
            .ds-story-wrapper {
              background: #0f1923;
              color: #e2e8f0;
            }
          }
        </style>
        ${Story()}
      </div>
    `,
  ],
  
  // Tags para organização
  tags: ['autodocs'],
};

export default preview;
