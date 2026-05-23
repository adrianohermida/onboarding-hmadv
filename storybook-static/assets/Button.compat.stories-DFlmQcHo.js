/* empty css                */function g(i={}){const{children:d="Salvar Alteracoes",variant:l="primary",size:m="md",disabled:t=!1,loading:o=!1,block:p=!1,icon:c=""}=i;return`
  <button
    class="ds-btn ds-btn-${l} ds-btn-${m} ${p?"ds-btn-block":""} ${t?"is-disabled":""} ${o?"is-loading":""}"
    ${t?"disabled":""}
    aria-busy="${o}"
  >
    ${c?`<span class="ds-btn-icon">${c}</span>`:""}
    <span class="ds-btn-label">${d}</span>
    ${o?'<span class="ds-btn-spinner"></span>':""}
  </button>
`}const b={title:"Design System/Componentes/Botões",tags:["autodocs"],render:g,args:{children:"Salvar Alteracoes",variant:"primary",size:"md",disabled:!1,loading:!1,block:!1}},a={args:{variant:"primary",children:"Confirmar Acao"}},r={args:{variant:"secondary",children:"Cancelar"}},e={args:{variant:"outline",children:"Ver Detalhes"}},s={args:{variant:"ghost",children:"Ignorar"}},n={args:{variant:"danger",children:"Excluir"}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Confirmar Acao'
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Cancelar'
  }
}`,...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Ver Detalhes'
  }
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ignorar'
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Excluir'
  }
}`,...n.parameters?.docs?.source}}};const h=["Primary","Secondary","Outline","Ghost","Danger"];export{n as Danger,s as Ghost,e as Outline,a as Primary,r as Secondary,h as __namedExportsOrder,b as default};
