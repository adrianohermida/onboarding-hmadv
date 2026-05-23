/* empty css                */function k(h={}){const{children:v="Salvar Alteracoes",variant:y="primary",size:x="md",disabled:m=!1,loading:p=!1,block:S=!1,icon:g=""}=h;return`
  <button
    class="ds-btn ds-btn-${y} ds-btn-${x} ${S?"ds-btn-block":""} ${m?"is-disabled":""} ${p?"is-loading":""}"
    ${m?"disabled":""}
    aria-busy="${p}"
  >
    ${g?`<span class="ds-btn-icon">${g}</span>`:""}
    <span class="ds-btn-label">${v}</span>
    ${p?'<span class="ds-btn-spinner"></span>':""}
  </button>
`}const w={title:"Design System/Componentes/Botões",tags:["autodocs"],render:k,args:{children:"Salvar Alteracoes",variant:"primary",size:"md",disabled:!1,loading:!1,block:!1}},s={args:{variant:"primary",children:"Confirmar Acao"}},n={args:{variant:"secondary",children:"Cancelar"}},r={args:{variant:"outline",children:"Ver Detalhes"}},a={args:{variant:"ghost",children:"Ignorar"}},t={args:{variant:"danger",children:"Excluir"}},e={render:()=>`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  `},o={args:{block:!0,children:"Botao Full Width"}},d={args:{loading:!0,children:"Salvando..."}},i={args:{disabled:!0,children:"Nao clicavel"}},c={args:{icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',children:"Continuar"}},l={render:()=>`
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
  `},b={render:()=>`
    <div class="ds-btn-group" role="group" aria-label="Acoes do documento">
      <button class="ds-btn ds-btn-outline ds-btn-sm">Visualizar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Editar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Compartilhar</button>
    </div>
  `},u={render:()=>`
    <div class="ds-btn-stack-mobile">
      <button class="ds-btn ds-btn-primary ds-btn-block-mobile">Acao Principal</button>
      <button class="ds-btn ds-btn-secondary ds-btn-block-mobile">Acao Secundaria</button>
    </div>
  `};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Confirmar Acao'
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Cancelar'
  }
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Ver Detalhes'
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ignorar'
  }
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Excluir'
  }
}`,...t.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  \`
}`,...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    block: true,
    children: 'Botao Full Width'
  }
}`,...o.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    children: 'Salvando...'
  }
}`,...d.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Nao clicavel'
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    children: 'Continuar'
  }
}`,...c.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => \`
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
  \`
}`,...l.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <div class="ds-btn-group" role="group" aria-label="Acoes do documento">
      <button class="ds-btn ds-btn-outline ds-btn-sm">Visualizar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Editar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Compartilhar</button>
    </div>
  \`
}`,...b.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <div class="ds-btn-stack-mobile">
      <button class="ds-btn ds-btn-primary ds-btn-block-mobile">Acao Principal</button>
      <button class="ds-btn ds-btn-secondary ds-btn-block-mobile">Acao Secundaria</button>
    </div>
  \`
}`,...u.parameters?.docs?.source}}};const M=["Primary","Secondary","Outline","Ghost","Danger","Sizes","BlockMobile","Loading","Disabled","WithIcon","IconOnly","ButtonGroup","MobileStacked"];export{o as BlockMobile,b as ButtonGroup,t as Danger,i as Disabled,a as Ghost,l as IconOnly,d as Loading,u as MobileStacked,r as Outline,s as Primary,n as Secondary,e as Sizes,c as WithIcon,M as __namedExportsOrder,w as default};
