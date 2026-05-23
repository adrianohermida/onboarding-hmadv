import type { Meta, StoryObj } from '@storybook/html';
import '../tokens/core-v2.css';
import '../components/base-v2.css';

/**
 * ## Inputs do Design System Recupera Empresas
 * 
 * Campos de formulário responsivos mobile-first com:
 * - Labels acessíveis
 * - Estados: focus, error, disabled
 * - Suporte a dark mode
 * - Validação nativa do HTML5
 */

// Template base
function Template({ type, size, state, label, placeholder, helperText, required }: any) {
  const isError = state === 'error';
  const isDisabled = state === 'disabled';
  const isFocus = state === 'focus';

  return `
    <div class="ds-form-group" style="max-width: 400px;">
      <label class="ds-label ${required ? 'is-required' : ''}" for="input-${type}">
        ${label}
        ${required ? '<span class="ds-required">*</span>' : ''}
      </label>

      <input
        type="${type}"
        id="input-${type}"
        class="ds-input ds-input-${size} ${isError ? 'is-error' : ''} ${isFocus ? 'is-focused' : ''}"
        placeholder="${placeholder}"
        ${isDisabled ? 'disabled' : ''}
        ${required ? 'required' : ''}
        ${isError ? 'aria-invalid="true"' : ''}
      />

      ${helperText || isError ? `<span class="ds-helper-text ${isError ? 'is-error' : ''}">${helperText || 'Campo inválido'}</span>` : ''}
    </div>
  `;
}

const meta = {
  title: 'Componentes/Inputs',
  tags: ['autodocs'],
  render: Template,
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'date', 'search'],
      description: 'Tipo do input',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamanho do input',
    },
    state: {
      control: 'select',
      options: ['default', 'focus', 'error', 'disabled'],
      description: 'Estado do input',
    },
    label: {
      control: 'text',
      description: 'Label do campo',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    helperText: {
      control: 'text',
      description: 'Texto de ajuda',
    },
    required: {
      control: 'boolean',
      description: 'Campo obrigatório',
    },
  },
  args: {
    type: 'text',
    size: 'md',
    state: 'default',
    label: 'Nome Completo',
    placeholder: 'Digite seu nome',
    helperText: '',
    required: false,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ### Text Input
 * Campo de texto padrão
 */
export const Text: Story = {
  args: {
    type: 'text',
    label: 'Nome Completo',
    placeholder: 'Digite seu nome',
  },
};

/**
 * ### Email Input
 * Validação de email
 */
export const Email: Story = {
  args: {
    type: 'email',
    label: 'E-mail',
    placeholder: 'seu@email.com',
    helperText: 'Enviaremos confirmação para este e-mail',
  },
};

/**
 * ### Password Input
 * Campo de senha
 */
export const Password: Story = {
  args: {
    type: 'password',
    label: 'Senha',
    placeholder: '••••••••',
    helperText: 'Mínimo 8 caracteres',
  },
};

/**
 * ### Number Input
 * Apenas números
 */
export const Number: Story = {
  args: {
    type: 'number',
    label: 'Idade',
    placeholder: '0',
  },
};

/**
 * ### Tel Input
 * Telefone (mobile optimized)
 */
export const Tel: Story = {
  args: {
    type: 'tel',
    label: 'Telefone',
    placeholder: '(11) 99999-9999',
    helperText: 'Formato: (XX) XXXXX-XXXX',
  },
};

/**
 * ### Date Input
 * Seletor de data
 */
export const Date: Story = {
  args: {
    type: 'date',
    label: 'Data de Nascimento',
  },
};

/**
 * ### Search Input
 * Busca com ícone
 */
export const Search: Story = {
  render: () => `
    <div class="ds-form-group" style="max-width: 400px;">
      <label class="ds-label" for="search-input">Buscar</label>
      <div class="ds-input-wrapper ds-input-with-icon">
        <svg class="ds-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          type="search" 
          id="search-input"
          class="ds-input ds-input-md"
          placeholder="Buscar processos..."
        />
      </div>
    </div>
  `,
};

/**
 * ### Error State
 * Com mensagem de erro
 */
export const ErrorState: Story = {
  args: {
    type: 'email',
    state: 'error',
    label: 'E-mail',
    placeholder: 'seu@email.com',
    helperText: 'Por favor, insira um e-mail válido',
  },
};

/**
 * ### Disabled State
 * Campo desabilitado
 */
export const DisabledState: Story = {
  args: {
    type: 'text',
    state: 'disabled',
    label: 'CPF (somente leitura)',
    placeholder: '000.000.000-00',
  },
};

/**
 * ### Required Field
 * Campo obrigatório
 */
export const Required: Story = {
  args: {
    type: 'text',
    label: 'Nome Completo',
    placeholder: 'Digite seu nome',
    required: true,
    helperText: 'Campo obrigatório',
  },
};

/**
 * ### Tamanhos
 * Comparativo de tamanhos
 */
export const Sizes: Story = {
  render: () => `
    <div class="ds-form-group" style="max-width: 400px; display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <label class="ds-label">Small (40px)</label>
        <input type="text" class="ds-input ds-input-sm" placeholder="Input pequeno" />
      </div>
      
      <div>
        <label class="ds-label">Medium (48px)</label>
        <input type="text" class="ds-input ds-input-md" placeholder="Input médio (padrão)" />
      </div>
      
      <div>
        <label class="ds-label">Large (56px)</label>
        <input type="text" class="ds-input ds-input-lg" placeholder="Input grande" />
      </div>
    </div>
  `,
};

/**
 * ### With Helper Text
 * Texto de ajuda
 */
export const WithHelperText: Story = {
  args: {
    type: 'password',
    label: 'Nova Senha',
    placeholder: '••••••••',
    helperText: 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um número',
  },
};

/**
 * ### Input Group
 * Múltiplos inputs relacionados
 */
export const InputGroup: Story = {
  render: () => `
    <div class="ds-form-group" style="max-width: 400px;">
      <label class="ds-label">Endereço</label>
      
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <input 
          type="text" 
          class="ds-input ds-input-md" 
          placeholder="CEP"
          style="flex: 0 0 120px;"
        />
        <input 
          type="text" 
          class="ds-input ds-input-md" 
          placeholder="Rua"
          style="flex: 1;"
        />
        <input 
          type="text" 
          class="ds-input ds-input-md" 
          placeholder="Número"
          style="flex: 0 0 80px;"
        />
      </div>
    </div>
  `,
};

/**
 * ### Mobile Optimized
 * Otimizado para mobile (touch-friendly)
 */
export const MobileOptimized: Story = {
  render: () => `
    <style>
      .ds-mobile-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem;
      }
      
      /* Touch targets maiores em mobile */
      @media (max-width: 768px) {
        .ds-input {
          min-height: 56px;
          font-size: 16px; /* Previne zoom no iOS */
        }
        
        .ds-label {
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }
      }
    </style>
    
    <div class="ds-mobile-form">
      <div class="ds-form-group">
        <label class="ds-label is-required" for="mobile-name">Nome</label>
        <input 
          type="text" 
          id="mobile-name"
          class="ds-input ds-input-lg"
          placeholder="Seu nome completo"
          required
        />
      </div>
      
      <div class="ds-form-group">
        <label class="ds-label is-required" for="mobile-email">E-mail</label>
        <input 
          type="email" 
          id="mobile-email"
          class="ds-input ds-input-lg"
          placeholder="seu@email.com"
          required
        />
      </div>
      
      <div class="ds-form-group">
        <label class="ds-label is-required" for="mobile-phone">Telefone</label>
        <input 
          type="tel" 
          id="mobile-phone"
          class="ds-input ds-input-lg"
          placeholder="(11) 99999-9999"
          required
        />
      </div>
      
      <button class="ds-btn ds-btn-primary ds-btn-lg ds-btn-block-mobile">
        Cadastrar
      </button>
    </div>
  `,
};

/**
 * ### Floating Label
 * Label animado (estilo Material Design)
 */
export const FloatingLabel: Story = {
  render: () => `
    <style>
      .ds-floating-label {
        position: relative;
      }
      
      .ds-floating-label input {
        width: 100%;
        padding: 1.25rem 1rem 0.5rem;
      }
      
      .ds-floating-label label {
        position: absolute;
        left: 1rem;
        top: 1rem;
        transition: all 0.2s ease;
        pointer-events: none;
        color: #64748b;
      }
      
      .ds-floating-label input:focus,
      .ds-floating-label input:not(:placeholder-shown) {
        padding-top: 1.25rem;
      }
      
      .ds-floating-label input:focus ~ label,
      .ds-floating-label input:not(:placeholder-shown) ~ label {
        top: 0.25rem;
        font-size: 0.75rem;
        color: #1a3a5c;
      }
    </style>
    
    <div class="ds-form-group" style="max-width: 400px;">
      <div class="ds-floating-label">
        <input 
          type="text" 
          class="ds-input ds-input-md"
          placeholder=" "
          id="floating-name"
        />
        <label for="floating-name">Nome Completo</label>
      </div>
    </div>
  `,
};
