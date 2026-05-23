/* empty css                */const h={title:"Componentes/Inputs",tags:["autodocs"],argTypes:{type:{control:"select",options:["text","email","password","number","tel","date","search"],description:"Tipo do input"},size:{control:"select",options:["sm","md","lg"],description:"Tamanho do input"},state:{control:"select",options:["default","focus","error","disabled"],description:"Estado do input"},label:{control:"text",description:"Label do campo"},placeholder:{control:"text",description:"Placeholder text"},helperText:{control:"text",description:"Texto de ajuda"},required:{control:"boolean",description:"Campo obrigatório"}},args:{type:"text",size:"md",state:"default",label:"Nome Completo",placeholder:"Digite seu nome",helperText:"",required:!1},parameters:{docs:{description:{component:`## Inputs do Design System Recupera Empresas\r
\r
Campos de formulário responsivos mobile-first com:\r
- Labels acessíveis\r
- Estados: focus, error, disabled\r
- Suporte a dark mode\r
- Validação nativa do HTML5`}}}},e={args:{type:"text",label:"Nome Completo",placeholder:"Digite seu nome"}},s={args:{type:"email",label:"E-mail",placeholder:"seu@email.com",helperText:"Enviaremos confirmação para este e-mail"}},a={args:{type:"password",label:"Senha",placeholder:"••••••••",helperText:"Mínimo 8 caracteres"}},r={args:{type:"number",label:"Idade",placeholder:"0"}},t={args:{type:"tel",label:"Telefone",placeholder:"(11) 99999-9999",helperText:"Formato: (XX) XXXXX-XXXX"}},n={args:{type:"date",label:"Data de Nascimento"}},l={render:()=>`
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
  `},o={args:{type:"email",state:"error",label:"E-mail",placeholder:"seu@email.com",helperText:"Por favor, insira um e-mail válido"}},i={args:{type:"text",state:"disabled",label:"CPF (somente leitura)",placeholder:"000.000.000-00"}},d={args:{type:"text",label:"Nome Completo",placeholder:"Digite seu nome",required:!0,helperText:"Campo obrigatório"}},p={render:()=>`
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
  `},c={args:{type:"password",label:"Nova Senha",placeholder:"••••••••",helperText:"A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um número"}},m={render:()=>`
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
  `},u={render:()=>`
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
  `},b={render:()=>`
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
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'text',
    label: 'Nome Completo',
    placeholder: 'Digite seu nome'
  }
}`,...e.parameters?.docs?.source},description:{story:`### Text Input\r
Campo de texto padrão`,...e.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'email',
    label: 'E-mail',
    placeholder: 'seu@email.com',
    helperText: 'Enviaremos confirmação para este e-mail'
  }
}`,...s.parameters?.docs?.source},description:{story:`### Email Input\r
Validação de email`,...s.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'password',
    label: 'Senha',
    placeholder: '••••••••',
    helperText: 'Mínimo 8 caracteres'
  }
}`,...a.parameters?.docs?.source},description:{story:`### Password Input\r
Campo de senha`,...a.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'number',
    label: 'Idade',
    placeholder: '0'
  }
}`,...r.parameters?.docs?.source},description:{story:`### Number Input\r
Apenas números`,...r.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'tel',
    label: 'Telefone',
    placeholder: '(11) 99999-9999',
    helperText: 'Formato: (XX) XXXXX-XXXX'
  }
}`,...t.parameters?.docs?.source},description:{story:`### Tel Input\r
Telefone (mobile optimized)`,...t.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'date',
    label: 'Data de Nascimento'
  }
}`,...n.parameters?.docs?.source},description:{story:`### Date Input\r
Seletor de data`,...n.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => \`
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
  \`
}`,...l.parameters?.docs?.source},description:{story:`### Search Input\r
Busca com ícone`,...l.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'email',
    state: 'error',
    label: 'E-mail',
    placeholder: 'seu@email.com',
    helperText: 'Por favor, insira um e-mail válido'
  }
}`,...o.parameters?.docs?.source},description:{story:`### Error State\r
Com mensagem de erro`,...o.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'text',
    state: 'disabled',
    label: 'CPF (somente leitura)',
    placeholder: '000.000.000-00'
  }
}`,...i.parameters?.docs?.source},description:{story:`### Disabled State\r
Campo desabilitado`,...i.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'text',
    label: 'Nome Completo',
    placeholder: 'Digite seu nome',
    required: true,
    helperText: 'Campo obrigatório'
  }
}`,...d.parameters?.docs?.source},description:{story:`### Required Field\r
Campo obrigatório`,...d.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => \`
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
  \`
}`,...p.parameters?.docs?.source},description:{story:`### Tamanhos\r
Comparativo de tamanhos`,...p.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'password',
    label: 'Nova Senha',
    placeholder: '••••••••',
    helperText: 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um número'
  }
}`,...c.parameters?.docs?.source},description:{story:`### With Helper Text\r
Texto de ajuda`,...c.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => \`
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
  \`
}`,...m.parameters?.docs?.source},description:{story:`### Input Group\r
Múltiplos inputs relacionados`,...m.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => \`
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
  \`
}`,...u.parameters?.docs?.source},description:{story:`### Mobile Optimized\r
Otimizado para mobile (touch-friendly)`,...u.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => \`
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
  \`
}`,...b.parameters?.docs?.source},description:{story:`### Floating Label\r
Label animado (estilo Material Design)`,...b.parameters?.docs?.description}}};const x=["Text","Email","Password","Number","Tel","Date","Search","ErrorState","DisabledState","Required","Sizes","WithHelperText","InputGroup","MobileOptimized","FloatingLabel"];export{n as Date,i as DisabledState,s as Email,o as ErrorState,b as FloatingLabel,m as InputGroup,u as MobileOptimized,r as Number,a as Password,d as Required,l as Search,p as Sizes,t as Tel,e as Text,c as WithHelperText,x as __namedExportsOrder,h as default};
