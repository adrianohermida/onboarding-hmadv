/* empty css                */function zs(Cs={}){const{children:Es="Salvar Alterações",variant:Ls="primary",size:$s="md",disabled:m=!1,loading:u=!1,block:Vs=!1,icon:g=""}=Cs;return`
  <button 
    class="ds-btn ds-btn-${Ls} ds-btn-${$s} ${Vs?"ds-btn-block":""} ${m?"is-disabled":""} ${u?"is-loading":""}"
    ${m?"disabled":""}
    aria-busy="${u}"
  >
    ${g?`<span class="ds-btn-icon">${g}</span>`:""}
    <span class="ds-btn-label">${Es}</span>
    ${u?'<span class="ds-btn-spinner"></span>':""}
  </button>
`}const Gs={title:"Componentes/Botões",tags:["autodocs"],render:zs,argTypes:{variant:{control:"select",options:["primary","secondary","outline","ghost","danger"],description:"Variante visual do botão"},size:{control:"select",options:["sm","md","lg","xl"],description:"Tamanho do botão"},disabled:{control:"boolean",description:"Estado desabilitado"},loading:{control:"boolean",description:"Estado de carregamento"},block:{control:"boolean",description:"Largura total (block)"},icon:{control:"text",description:"Ícone (SVG ou classe)"}},args:{children:"Salvar Alterações",variant:"primary",size:"md",disabled:!1,loading:!1,block:!1},parameters:{docs:{description:{component:`## Botões do Design System Recupera Empresas\r
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
  `};var h,v,y,S,k;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Confirmar Ação'
  }
}`,...(y=(v=s.parameters)==null?void 0:v.docs)==null?void 0:y.source},description:{story:`### Primário\r
Ação principal da interface`,...(k=(S=s.parameters)==null?void 0:S.docs)==null?void 0:k.description}}};var x,f,w,A,B;r.parameters={...r.parameters,docs:{...(x=r.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    variant: 'secondary',
    children: 'Cancelar'
  }
}`,...(w=(f=r.parameters)==null?void 0:f.docs)==null?void 0:w.source},description:{story:`### Secundário\r
Ações secundárias`,...(B=(A=r.parameters)==null?void 0:A.docs)==null?void 0:B.description}}};var M,C,E,L,$;e.parameters={...e.parameters,docs:{...(M=e.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    variant: 'outline',
    children: 'Ver Detalhes'
  }
}`,...(E=(C=e.parameters)==null?void 0:C.docs)==null?void 0:E.source},description:{story:`### Outline\r
Borda com fundo transparente`,...($=(L=e.parameters)==null?void 0:L.docs)==null?void 0:$.description}}};var V,z,D,G,O;t.parameters={...t.parameters,docs:{...(V=t.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    children: 'Ignorar'
  }
}`,...(D=(z=t.parameters)==null?void 0:z.docs)==null?void 0:D.source},description:{story:`### Ghost\r
Sem borda ou fundo (hover apenas)`,...(O=(G=t.parameters)==null?void 0:G.docs)==null?void 0:O.description}}};var I,P,T,W,H;n.parameters={...n.parameters,docs:{...(I=n.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    variant: 'danger',
    children: 'Excluir'
  }
}`,...(T=(P=n.parameters)==null?void 0:P.docs)==null?void 0:T.source},description:{story:`### Danger\r
Ações destrutivas`,...(H=(W=n.parameters)==null?void 0:W.docs)==null?void 0:H.description}}};var q,F,N,X,_;a.parameters={...a.parameters,docs:{...(q=a.parameters)==null?void 0:q.docs,source:{originalSource:`{
  render: () => \`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <button class="ds-btn ds-btn-primary ds-btn-sm">Small (32px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-md">Medium (40px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-lg">Large (48px)</button>
      <button class="ds-btn ds-btn-primary ds-btn-xl">XL (56px)</button>
    </div>
  \`
}`,...(N=(F=a.parameters)==null?void 0:F.docs)==null?void 0:N.source},description:{story:`### Tamanhos\r
Comparativo de tamanhos`,...(_=(X=a.parameters)==null?void 0:X.docs)==null?void 0:_.description}}};var R,j,J,K,Q;o.parameters={...o.parameters,docs:{...(R=o.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    block: true,
    children: 'Botão Full Width'
  }
}`,...(J=(j=o.parameters)==null?void 0:j.docs)==null?void 0:J.source},description:{story:`### Block Mobile\r
Largura total em mobile`,...(Q=(K=o.parameters)==null?void 0:K.docs)==null?void 0:Q.description}}};var U,Y,Z,ss,rs;i.parameters={...i.parameters,docs:{...(U=i.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    loading: true,
    children: 'Salvando...'
  }
}`,...(Z=(Y=i.parameters)==null?void 0:Y.docs)==null?void 0:Z.source},description:{story:`### Loading State\r
Estado de carregamento`,...(rs=(ss=i.parameters)==null?void 0:ss.docs)==null?void 0:rs.description}}};var es,ts,ns,as,os;d.parameters={...d.parameters,docs:{...(es=d.parameters)==null?void 0:es.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Não clicável'
  }
}`,...(ns=(ts=d.parameters)==null?void 0:ts.docs)==null?void 0:ns.source},description:{story:`### Disabled State\r
Estado desabilitado`,...(os=(as=d.parameters)==null?void 0:as.docs)==null?void 0:os.description}}};var is,ds,cs,ls,ps;c.parameters={...c.parameters,docs:{...(is=c.parameters)==null?void 0:is.docs,source:{originalSource:`{
  args: {
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    children: 'Continuar'
  }
}`,...(cs=(ds=c.parameters)==null?void 0:ds.docs)==null?void 0:cs.source},description:{story:`### Com Ícone\r
Botão com ícone à esquerda`,...(ps=(ls=c.parameters)==null?void 0:ls.docs)==null?void 0:ps.description}}};var bs,us,ms,gs,hs;l.parameters={...l.parameters,docs:{...(bs=l.parameters)==null?void 0:bs.docs,source:{originalSource:`{
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
}`,...(ms=(us=l.parameters)==null?void 0:us.docs)==null?void 0:ms.source},description:{story:`### Icon Only\r
Apenas ícone (para toolbars)`,...(hs=(gs=l.parameters)==null?void 0:gs.docs)==null?void 0:hs.description}}};var vs,ys,Ss,ks,xs;p.parameters={...p.parameters,docs:{...(vs=p.parameters)==null?void 0:vs.docs,source:{originalSource:`{
  render: () => \`
    <div class="ds-btn-group" role="group" aria-label="Ações do documento">
      <button class="ds-btn ds-btn-outline ds-btn-sm">Visualizar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Editar</button>
      <button class="ds-btn ds-btn-outline ds-btn-sm">Compartilhar</button>
    </div>
  \`
}`,...(Ss=(ys=p.parameters)==null?void 0:ys.docs)==null?void 0:Ss.source},description:{story:`### Grupo de Botões\r
Múltiplos botões relacionados`,...(xs=(ks=p.parameters)==null?void 0:ks.docs)==null?void 0:xs.description}}};var fs,ws,As,Bs,Ms;b.parameters={...b.parameters,docs:{...(fs=b.parameters)==null?void 0:fs.docs,source:{originalSource:`{
  render: () => \`
    <div class="ds-btn-stack-mobile">
      <button class="ds-btn ds-btn-primary ds-btn-block-mobile">Ação Principal</button>
      <button class="ds-btn ds-btn-secondary ds-btn-block-mobile">Ação Secundária</button>
    </div>
  \`
}`,...(As=(ws=b.parameters)==null?void 0:ws.docs)==null?void 0:As.source},description:{story:`### Mobile Stacked\r
Empilhado em telas pequenas`,...(Ms=(Bs=b.parameters)==null?void 0:Bs.docs)==null?void 0:Ms.description}}};const Os=["Primary","Secondary","Outline","Ghost","Danger","Sizes","BlockMobile","Loading","Disabled","WithIcon","IconOnly","ButtonGroup","MobileStacked"];export{o as BlockMobile,p as ButtonGroup,n as Danger,d as Disabled,t as Ghost,l as IconOnly,i as Loading,b as MobileStacked,e as Outline,s as Primary,r as Secondary,a as Sizes,c as WithIcon,Os as __namedExportsOrder,Gs as default};
