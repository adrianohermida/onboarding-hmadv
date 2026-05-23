/* empty css                */function os(ns={}){const{children:rs="Salvar Alteracoes",variant:as="primary",size:ts="md",disabled:m=!1,loading:p=!1,block:es=!1,icon:g=""}=ns;return`
  <button
    class="ds-btn ds-btn-${as} ds-btn-${ts} ${es?"ds-btn-block":""} ${m?"is-disabled":""} ${p?"is-loading":""}"
    ${m?"disabled":""}
    aria-busy="${p}"
  >
    ${g?`<span class="ds-btn-icon">${g}</span>`:""}
    <span class="ds-btn-label">${rs}</span>
    ${p?'<span class="ds-btn-spinner"></span>':""}
  </button>
`}const is={title:"Design System/Componentes/Botões",tags:["autodocs"],render:os,args:{children:"Salvar Alteracoes",variant:"primary",size:"md",disabled:!1,loading:!1,block:!1}},s={args:{variant:"primary",children:"Confirmar Acao"}},n={args:{variant:"secondary",children:"Cancelar"}},r={args:{variant:"outline",children:"Ver Detalhes"}},a={args:{variant:"ghost",children:"Ignorar"}},t={args:{variant:"danger",children:"Excluir"}},e={render:()=>`
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
  `};var h,v,y;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Confirmar Acao'
  }
}`,...(y=(v=s.parameters)==null?void 0:v.docs)==null?void 0:y.source}}};var x,S,k;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Cancelar'
  }
}`,...(k=(S=n.parameters)==null?void 0:S.docs)==null?void 0:k.source}}};var f,w,M;r.parameters={...r.parameters,docs:{...(f=r.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Ver Detalhes'
  }
}`,...(M=(w=r.parameters)==null?void 0:w.docs)==null?void 0:M.source}}};var C,B,$;a.parameters={...a.parameters,docs:{...(C=a.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ignorar'
  }
}`,...($=(B=a.parameters)==null?void 0:B.docs)==null?void 0:$.source}}};var A,E,z;t.parameters={...t.parameters,docs:{...(A=t.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Excluir'
  }
}`,...(z=(E=t.parameters)==null?void 0:E.docs)==null?void 0:z.source}}};var L,V,D;e.parameters={...e.parameters,docs:{...(L=e.parameters)==null?void 0:L.docs,source:{originalSource:`{
  render: () => \`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  \`
}`,...(D=(V=e.parameters)==null?void 0:V.docs)==null?void 0:D.source}}};var I,O,G;o.parameters={...o.parameters,docs:{...(I=o.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    block: true,
    children: 'Botao Full Width'
  }
}`,...(G=(O=o.parameters)==null?void 0:O.docs)==null?void 0:G.source}}};var H,P,W;d.parameters={...d.parameters,docs:{...(H=d.parameters)==null?void 0:H.docs,source:{originalSource:`{
  args: {
    loading: true,
    children: 'Salvando...'
  }
}`,...(W=(P=d.parameters)==null?void 0:P.docs)==null?void 0:W.source}}};var F,N,X;i.parameters={...i.parameters,docs:{...(F=i.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Nao clicavel'
  }
}`,...(X=(N=i.parameters)==null?void 0:N.docs)==null?void 0:X.source}}};var _,T,j;c.parameters={...c.parameters,docs:{...(_=c.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    children: 'Continuar'
  }
}`,...(j=(T=c.parameters)==null?void 0:T.docs)==null?void 0:j.source}}};var q,J,K;l.parameters={...l.parameters,docs:{...(q=l.parameters)==null?void 0:q.docs,source:{originalSource:`{
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
}`,...(K=(J=l.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,R,U;b.parameters={...b.parameters,docs:{...(Q=b.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  render: () => \`
    <div class="ds-btn-group" role="group" aria-label="Acoes do documento">
      <button class="ds-btn ds-btn-outline ds-btn-sm">Visualizar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Editar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Compartilhar</button>
    </div>
  \`
}`,...(U=(R=b.parameters)==null?void 0:R.docs)==null?void 0:U.source}}};var Y,Z,ss;u.parameters={...u.parameters,docs:{...(Y=u.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  render: () => \`
    <div class="ds-btn-stack-mobile">
      <button class="ds-btn ds-btn-primary ds-btn-block-mobile">Acao Principal</button>
      <button class="ds-btn ds-btn-secondary ds-btn-block-mobile">Acao Secundaria</button>
    </div>
  \`
}`,...(ss=(Z=u.parameters)==null?void 0:Z.docs)==null?void 0:ss.source}}};const cs=["Primary","Secondary","Outline","Ghost","Danger","Sizes","BlockMobile","Loading","Disabled","WithIcon","IconOnly","ButtonGroup","MobileStacked"];export{o as BlockMobile,b as ButtonGroup,t as Danger,i as Disabled,a as Ghost,l as IconOnly,d as Loading,u as MobileStacked,r as Outline,s as Primary,n as Secondary,e as Sizes,c as WithIcon,cs as __namedExportsOrder,is as default};
