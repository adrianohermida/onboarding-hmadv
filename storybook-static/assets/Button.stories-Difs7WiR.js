/* empty css                */function x(h={}){const{children:v="Salvar Alterações",variant:y="primary",size:S="md",disabled:m=!1,loading:u=!1,block:k=!1,icon:g=""}=h;return`
  <button 
    class="ds-btn ds-btn-${y} ds-btn-${S} ${k?"ds-btn-block":""} ${m?"is-disabled":""} ${u?"is-loading":""}"
    ${m?"disabled":""}
    aria-busy="${u}"
  >
    ${g?`<span class="ds-btn-icon">${g}</span>`:""}
    <span class="ds-btn-label">${v}</span>
    ${u?'<span class="ds-btn-spinner"></span>':""}
  </button>
`}const w={title:"Componentes/Botões",tags:["autodocs"],render:x,argTypes:{variant:{control:"select",options:["primary","secondary","outline","ghost","danger"],description:"Variante visual do botão"},size:{control:"select",options:["sm","md","lg","xl"],description:"Tamanho do botão"},disabled:{control:"boolean",description:"Estado desabilitado"},loading:{control:"boolean",description:"Estado de carregamento"},block:{control:"boolean",description:"Largura total (block)"},icon:{control:"text",description:"Ícone (SVG ou classe)"}},args:{children:"Salvar Alterações",variant:"primary",size:"md",disabled:!1,loading:!1,block:!1},parameters:{docs:{description:{component:`## Botões do Design System Recupera Empresas\r
\r
Botões responsivos mobile-first com:\r
- Touch targets de 48×48px (Android) / 44×44px (iOS)\r
- Estados: hover, active, disabled, focus-visible\r
- Suporte a dark mode automático\r
- Acessibilidade WCAG AA`}}}},s={args:{variant:"primary",children:"Confirmar Ação"}},r={args:{variant:"secondary",children:"Cancelar"}},e={args:{variant:"outline",children:"Ver Detalhes"}},t={args:{variant:"ghost",children:"Ignorar"}},n={args:{variant:"danger",children:"Excluir"}},a={render:()=>`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  `},o={args:{block:!0,children:"Botão Full Width"}},i={args:{loading:!0,children:"Salvando..."}},d={args:{disabled:!0,children:"Não clicável"}},c={args:{icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',children:"Continuar"}},l={render:()=>`
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
  `},p={render:()=>`
    <div class="ds-btn-group" role="group" aria-label="Ações do documento">
      <button class="ds-btn ds-btn-outline ds-btn-sm">Visualizar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Editar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Compartilhar</button>
    </div>
  `},b={render:()=>`
    <div class="ds-btn-stack-mobile">
      <button class="ds-btn ds-btn-primary ds-btn-block-mobile">Ação Principal</button>
      <button class="ds-btn ds-btn-secondary ds-btn-block-mobile">Ação Secundária</button>
    </div>
  `};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Confirmar Ação'
  }
}`,...s.parameters?.docs?.source},description:{story:`### Primário\r
Ação principal da interface`,...s.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Cancelar'
  }
}`,...r.parameters?.docs?.source},description:{story:`### Secundário\r
Ações secundárias`,...r.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Ver Detalhes'
  }
}`,...e.parameters?.docs?.source},description:{story:`### Outline\r
Borda com fundo transparente`,...e.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ignorar'
  }
}`,...t.parameters?.docs?.source},description:{story:`### Ghost\r
Sem borda ou fundo (hover apenas)`,...t.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Excluir'
  }
}`,...n.parameters?.docs?.source},description:{story:`### Danger\r
Ações destrutivas`,...n.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  \`
}`,...a.parameters?.docs?.source},description:{story:`### Tamanhos\r
Comparativo de tamanhos`,...a.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    block: true,
    children: 'Botão Full Width'
  }
}`,...o.parameters?.docs?.source},description:{story:`### Block Mobile\r
Largura total em mobile`,...o.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    children: 'Salvando...'
  }
}`,...i.parameters?.docs?.source},description:{story:`### Loading State\r
Estado de carregamento`,...i.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Não clicável'
  }
}`,...d.parameters?.docs?.source},description:{story:`### Disabled State\r
Estado desabilitado`,...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    children: 'Continuar'
  }
}`,...c.parameters?.docs?.source},description:{story:`### Com Ícone\r
Botão com ícone à esquerda`,...c.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
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
}`,...l.parameters?.docs?.source},description:{story:`### Icon Only\r
Apenas ícone (para toolbars)`,...l.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <div class="ds-btn-group" role="group" aria-label="Ações do documento">
      <button class="ds-btn ds-btn-outline ds-btn-sm">Visualizar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Editar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Compartilhar</button>
    </div>
  \`
}`,...p.parameters?.docs?.source},description:{story:`### Grupo de Botões\r
Múltiplos botões relacionados`,...p.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <div class="ds-btn-stack-mobile">
      <button class="ds-btn ds-btn-primary ds-btn-block-mobile">Ação Principal</button>
      <button class="ds-btn ds-btn-secondary ds-btn-block-mobile">Ação Secundária</button>
    </div>
  \`
}`,...b.parameters?.docs?.source},description:{story:`### Mobile Stacked\r
Empilhado em telas pequenas`,...b.parameters?.docs?.description}}};const A=["Primary","Secondary","Outline","Ghost","Danger","Sizes","BlockMobile","Loading","Disabled","WithIcon","IconOnly","ButtonGroup","MobileStacked"];export{o as BlockMobile,p as ButtonGroup,n as Danger,d as Disabled,t as Ghost,l as IconOnly,i as Loading,b as MobileStacked,e as Outline,s as Primary,r as Secondary,a as Sizes,c as WithIcon,A as __namedExportsOrder,w as default};
