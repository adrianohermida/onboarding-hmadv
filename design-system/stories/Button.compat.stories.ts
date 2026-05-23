import type { Meta, StoryObj } from '@storybook/html';
import '../tokens/core-v2.css';
import '../components/base-v2.css';

function Template(args: any = {}) {
  const {
    children = 'Salvar Alteracoes',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    block = false,
    icon = '',
  } = args;

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

const meta = {
  title: 'Design System/Componentes/Botões',
  tags: ['autodocs'],
  render: Template,
  args: {
    children: 'Salvar Alteracoes',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    block: false,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Confirmar Acao',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancelar',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Ver Detalhes',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ignorar',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Excluir',
  },
};
