import type { Meta, StoryObj } from '@storybook/html';
import '../tokens/core-v2.css';
import '../components/base-v2.css';

/**
 * ## Cards do Design System Recupera Empresas
 * 
 * Cards responsivos mobile-first com:
 * - Layout adaptativo (stack em mobile, grid em desktop)
 * - Suporte a dark mode
 * - Acessibilidade WCAG AA
 * - Estados de hover e focus
 */

const meta = {
  title: 'Componentes/Cards',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'interactive'],
      description: 'Variante visual do card',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'full'],
      description: 'Tamanho do card',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Espaçamento interno',
    },
    clickable: {
      control: 'boolean',
      description: 'Card clicável (interativo)',
    },
  },
  args: {
    variant: 'default',
    size: 'md',
    padding: 'md',
    clickable: false,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Template base
const Template = ({ variant, size, padding, clickable, title, children }: any) => `
  <article class="ds-card ds-card-${variant} ds-card-${size} ds-card-p-${padding} ${clickable ? 'is-clickable' : ''}" 
           ${clickable ? 'tabindex="0" role="button"' : ''}>
    ${title ? `<header class="ds-card-header"><h3 class="ds-card-title">${title}</h3></header>` : ''}
    <div class="ds-card-body">
      ${children || '<p>Conteúdo do card</p>'}
    </div>
  </article>
`;

/**
 * ### Default
 * Card padrão sem elevação
 */
export const Default: Story = {
  args: {
    title: 'Card Padrão',
    children: '<p>Este é um card simples, ideal para listas e grids de conteúdo.</p>',
  },
};

/**
 * ### Elevated
 * Card com sombra (elevado)
 */
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    title: 'Card Elevado',
    children: '<p>Card com sombra para destacar conteúdo importante.</p>',
  },
};

/**
 * ### Outlined
 * Card com borda
 */
export const Outlined: Story = {
  args: {
    variant: 'outlined',
    title: 'Card com Borda',
    children: '<p>Card com borda sutil, bom para separar seções.</p>',
  },
};

/**
 * ### Interactive
 * Card interativo (hover + focus)
 */
export const Interactive: Story = {
  args: {
    variant: 'interactive',
    clickable: true,
    title: 'Card Clicável',
    children: '<p>Passe o mouse ou use Tab para ver os estados de hover e focus.</p>',
  },
};

/**
 * ### Tamanhos
 * Comparativo de tamanhos
 */
export const Sizes: Story = {
  render: () => `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <article class="ds-card ds-card-sm ds-card-p-sm">
        <div class="ds-card-body">
          <strong>Small</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">Card compacto para informações resumidas.</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-md ds-card-p-md">
        <div class="ds-card-body">
          <strong>Medium</strong>
          <p style="margin-top: 0.5rem;">Tamanho padrão para a maioria dos casos de uso.</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-lg ds-card-p-lg">
        <div class="ds-card-body">
          <strong>Large</strong>
          <p style="margin-top: 0.75rem;">Card grande para conteúdo detalhado ou formulários.</p>
        </div>
      </article>
    </div>
  `,
};

/**
 * ### Com Header e Footer
 * Estrutura completa
 */
export const WithHeaderFooter: Story = {
  render: () => `
    <article class="ds-card ds-card-md ds-card-elevated">
      <header class="ds-card-header">
        <h3 class="ds-card-title">Título do Card</h3>
        <span class="ds-card-subtitle">Subtítulo ou descrição</span>
      </header>
      
      <div class="ds-card-body">
        <p>Conteúdo principal do card. Pode conter texto, imagens, formulários, etc.</p>
        <ul style="margin-top: 0.5rem; padding-left: 1rem;">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
      
      <footer class="ds-card-footer">
        <button class="ds-btn ds-btn-primary ds-btn-sm">Ação Principal</button>
        <button class="ds-btn ds-btn-outline ds-btn-sm">Secundária</button>
      </footer>
    </article>
  `,
};

/**
 * ### Grid Responsivo
 * Layout que adapta de mobile para desktop
 */
export const ResponsiveGrid: Story = {
  render: () => `
    <style>
      .ds-card-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      @media (min-width: 640px) {
        .ds-card-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (min-width: 1024px) {
        .ds-card-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    </style>
    
    <div class="ds-card-grid">
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 1</h4>
          <p>Conteúdo do card 1</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 2</h4>
          <p>Conteúdo do card 2</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 3</h4>
          <p>Conteúdo do card 3</p>
        </div>
      </article>
    </div>
  `,
};

/**
 * ### Com Imagem
 * Card com imagem de destaque
 */
export const WithImage: Story = {
  render: () => `
    <article class="ds-card ds-card-md ds-card-elevated">
      <div class="ds-card-image" style="height: 160px; background: linear-gradient(135deg, #1a3a5c, #4f8ec8); border-radius: 8px 8px 0 0;"></div>
      <div class="ds-card-body ds-card-p-md">
        <h3 class="ds-card-title">Card com Imagem</h3>
        <p>Imagem de destaque no topo do card.</p>
      </div>
    </article>
  `,
};

/**
 * ### Status Badge
 * Card com indicador de status
 */
export const WithStatusBadge: Story = {
  render: () => `
    <article class="ds-card ds-card-md ds-card-outlined">
      <header class="ds-card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3 class="ds-card-title" style="margin: 0;">Processo Judicial</h3>
        <span class="ds-badge ds-badge-success">Ativo</span>
      </header>
      <div class="ds-card-body">
        <p><strong>Nº:</strong> 0012345-67.2024.8.26.0000</p>
        <p><strong>Cliente:</strong> João da Silva</p>
        <p><strong>Status:</strong> Em análise</p>
      </div>
    </article>
  `,
};

/**
 * ### Skeleton Loading
 * Estado de carregamento
 */
export const SkeletonLoading: Story = {
  render: () => `
    <article class="ds-card ds-card-md ds-card-p-md">
      <div class="ds-skeleton ds-skeleton-text" style="width: 60%; height: 24px; margin-bottom: 0.5rem;"></div>
      <div class="ds-skeleton ds-skeleton-text" style="width: 90%; height: 16px; margin-bottom: 0.25rem;"></div>
      <div class="ds-skeleton ds-skeleton-text" style="width: 80%; height: 16px;"></div>
    </article>
  `,
};

/**
 * ### Mobile Stack
 * Empilhado em mobile, lado a lado em desktop
 */
export const MobileStack: Story = {
  render: () => `
    <style>
      .ds-card-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      @media (min-width: 768px) {
        .ds-card-stack {
          flex-direction: row;
        }
      }
    </style>
    
    <div class="ds-card-stack">
      <article class="ds-card ds-card-elevated" style="flex: 1;">
        <div class="ds-card-body">
          <h4>Card 1</h4>
          <p>Empilhado em mobile, lado a lado em tablet+</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-elevated" style="flex: 1;">
        <div class="ds-card-body">
          <h4>Card 2</h4>
          <p>Empilhado em mobile, lado a lado em tablet+</p>
        </div>
      </article>
    </div>
  `,
};
