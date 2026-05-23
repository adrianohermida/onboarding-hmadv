/* empty css                */function x({children:h,variant:v,size:y,disabled:m,loading:u,block:S,icon:g}){return`
  <button 
    class="ds-btn ds-btn-${v} ds-btn-${y} ${S?"ds-btn-block":""} ${m?"is-disabled":""} ${u?"is-loading":""}"
    ${m?"disabled":""}
    aria-busy="${u}"
  >
    ${g?`<span class="ds-btn-icon">${g}</span>`:""}
    <span class="ds-btn-label">${h}</span>
    ${u?'<span class="ds-btn-spinner"></span>':""}
  </button>
`}const f={title:"Componentes/Botões",tags:["autodocs"],render:x,argTypes:{variant:{control:"select",options:["primary","secondary","outline","ghost","danger"],description:"Variante visual do botão"},size:{control:"select",options:["sm","md","lg","xl"],description:"Tamanho do botão"},disabled:{control:"boolean",description:"Estado desabilitado"},loading:{control:"boolean",description:"Estado de carregamento"},block:{control:"boolean",description:"Largura total (block)"},icon:{control:"text",description:"Ícone (SVG ou classe)"}},args:{children:"Salvar Alterações",variant:"primary",size:"md",disabled:!1,loading:!1,block:!1},parameters:{docs:{description:{component:`## Botões do Design System Recupera Empresas\r
\r
Botões responsivos mobile-first com:\r
- Touch targets de 48×48px (Android) / 44×44px (iOS)\r
- Estados: hover, active, disabled, focus-visible\r
- Suporte a dark mode automático\r
- Acessibilidade WCAG AA`}}}},r={args:{variant:"primary",children:"Confirmar Ação"}},s={args:{variant:"secondary",children:"Cancelar"}},t={args:{variant:"outline",children:"Ver Detalhes"}},e={args:{variant:"ghost",children:"Ignorar"}},n={args:{variant:"danger",children:"Excluir"}},o={render:()=>`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  `},a={args:{block:!0,children:"Botão Full Width"}},d={args:{loading:!0,children:"Salvando..."}},i={args:{disabled:!0,children:"Não clicável"}},c={args:{icon:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',children:"Continuar"}},l={render:()=>`
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
  `};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Confirmar Ação'
  }
}`,...r.parameters?.docs?.source},description:{story:`### Primário\r
Ação principal da interface`,...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Cancelar'
  }
}`,...s.parameters?.docs?.source},description:{story:`### Secundário\r
Ações secundárias`,...s.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Ver Detalhes'
  }
}`,...t.parameters?.docs?.source},description:{story:`### Outline\r
Borda com fundo transparente`,...t.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ignorar'
  }
}`,...e.parameters?.docs?.source},description:{story:`### Ghost\r
Sem borda ou fundo (hover apenas)`,...e.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Excluir'
  }
}`,...n.parameters?.docs?.source},description:{story:`### Danger\r
Ações destrutivas`,...n.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  \`
}`,...o.parameters?.docs?.source},description:{story:`### Tamanhos\r
Comparativo de tamanhos`,...o.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    block: true,
    children: 'Botão Full Width'
  }
}`,...a.parameters?.docs?.source},description:{story:`### Block Mobile\r
Largura total em mobile`,...a.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true,
    children: 'Salvando...'
  }
}`,...d.parameters?.docs?.source},description:{story:`### Loading State\r
Estado de carregamento`,...d.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Não clicável'
  }
}`,...i.parameters?.docs?.source},description:{story:`### Disabled State\r
Estado desabilitado`,...i.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
Empilhado em telas pequenas`,...b.parameters?.docs?.description}}};const w=["Primary","Secondary","Outline","Ghost","Danger","Sizes","BlockMobile","Loading","Disabled","WithIcon","IconOnly","ButtonGroup","MobileStacked"];export{a as BlockMobile,p as ButtonGroup,n as Danger,i as Disabled,e as Ghost,l as IconOnly,d as Loading,b as MobileStacked,t as Outline,r as Primary,s as Secondary,o as Sizes,c as WithIcon,w as __namedExportsOrder,f as default};
