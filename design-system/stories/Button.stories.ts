import type { Meta, StoryObj } from '@storybook/html';
import '../tokens/core-v2.css';
import '../components/base-v2.css';

function Template({ children, variant, size, disabled, loading, block, icon }: any) {
  return `
  <button 
    class="ds-btn ds-btn-${variant} ds-btn-${size} ${block ? 'ds-btn-block' : ''} ${disabled ? 'is-disabled' : ''} ${loading ? 'is-loading' : ''}"
    ${disabled ? 'disabled' : ''}
    aria-busy="${loading}"
  >
    ${icon ? `<span class="ds-btn-icon">${icon}</span>` : ''}
    <span class="ds-btn-label">${children}</span>
    ${loading ? '<span class="ds-btn-spinner"></span>' : ''}
  </button>
`;
}

/**
 * ## Botões do Design System Recupera Empresas
 * 
 * Botões responsivos mobile-first com:
 * - Touch targets de 48×48px (Android) / 44×44px (iOS)
 * - Estados: hover, active, disabled, focus-visible
 * - Suporte a dark mode automático
 * - Acessibilidade WCAG AA
 */

const meta = {
  title: 'Componentes/Botões',
  tags: ['autodocs'],
  render: Template,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Variante visual do botão',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Tamanho do botão',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado desabilitado',
    },
    loading: {
      control: 'boolean',
      description: 'Estado de carregamento',
    },
    block: {
      control: 'boolean',
      description: 'Largura total (block)',
    },
    icon: {
      control: 'text',
      description: 'Ícone (SVG ou classe)',
    },
  },
  args: {
    children: 'Salvar Alterações',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    block: false,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ### Primário
 * Ação principal da interface
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Confirmar Ação',
  },
};

/**
 * ### Secundário
 * Ações secundárias
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancelar',
  },
};

/**
 * ### Outline
 * Borda com fundo transparente
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Ver Detalhes',
  },
};

/**
 * ### Ghost
 * Sem borda ou fundo (hover apenas)
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ignorar',
  },
};

/**
 * ### Danger
 * Ações destrutivas
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Excluir',
  },
};

/**
 * ### Tamanhos
 * Comparativo de tamanhos
 */
export const Sizes: Story = {
  render: () => `
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  `,
};

/**
 * ### Block Mobile
 * Largura total em mobile
 */
export const BlockMobile: Story = {
  args: {
    block: true,
    children: 'Botão Full Width',
  },
};

/**
 * ### Loading State
 * Estado de carregamento
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Salvando...',
  },
};

/**
 * ### Disabled State
 * Estado desabilitado
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Não clicável',
  },
};

/**
 * ### Com Ícone
 * Botão com ícone à esquerda
 */
export const WithIcon: Story = {
  args: {
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    children: 'Continuar',
  },
};

/**
 * ### Icon Only
 * Apenas ícone (para toolbars)
 */
export const IconOnly: Story = {
  render: () => `
    <div style="display: flex; gap: 0.5rem;">
      <button class="ds-btn ds-btn-secondary ds-btn-icon" aria-label="Editar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="ds-btn ds-btn-secondary ds-btn-icon" aria-label="Excluir">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `,
};

/**
 * ### Grupo de Botões
 * Múltiplos botões relacionados
 */
export const ButtonGroup: Story = {
  render: () => `
    <div class="ds-btn-group" role="group" aria-label="Ações do documento">
      <button class="ds-btn ds-btn-outline ds-btn-sm">Visualizar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Editar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Compartilhar</button>
    </div>
  `,
};

/**
 * ### Mobile Stacked
 * Empilhado em telas pequenas
 */
export const MobileStacked: Story = {
  render: () => `
    <div class="ds-btn-stack-mobile">
      <button class="ds-btn ds-btn-primary ds-btn-block-mobile">Ação Principal</button>
      <button class="ds-btn ds-btn-secondary ds-btn-block-mobile">Ação Secundária</button>
    </div>
  `,
};
