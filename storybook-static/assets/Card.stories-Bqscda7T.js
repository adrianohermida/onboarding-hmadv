/* empty css                */const xa={title:"Componentes/Cards",tags:["autodocs"],render:Ca,argTypes:{variant:{control:"select",options:["default","elevated","outlined","interactive"],description:"Variante visual do card"},size:{control:"select",options:["sm","md","lg","full"],description:"Tamanho do card"},padding:{control:"select",options:["none","sm","md","lg"],description:"Espaçamento interno"},clickable:{control:"boolean",description:"Card clicável (interativo)"}},args:{variant:"default",size:"md",padding:"md",clickable:!1},parameters:{docs:{description:{component:`## Cards do Design System Recupera Empresas\r
\r
Cards responsivos mobile-first com:\r
- Layout adaptativo (stack em mobile, grid em desktop)\r
- Suporte a dark mode\r
- Acessibilidade WCAG AA\r
- Estados de hover e focus`}}}};function Ca(ga={}){const{variant:va="default",size:ha="md",padding:ba="md",clickable:p=!1,title:m="Card Padrão",children:ya="<p>Conteúdo do card</p>"}=ga;return`
  <article class="ds-card ds-card-${va} ds-card-${ha} ds-card-p-${ba} ${p?"is-clickable":""}" 
           ${p?'tabindex="0" role="button"':""}>
    ${m?`<header class="ds-card-header"><h3 class="ds-card-title">${m}</h3></header>`:""}
    <div class="ds-card-body">
      ${ya}
    </div>
  </article>
`}const a={args:{title:"Card Padrão",children:"<p>Este é um card simples, ideal para listas e grids de conteúdo.</p>"}},e={args:{variant:"elevated",title:"Card Elevado",children:"<p>Card com sombra para destacar conteúdo importante.</p>"}},d={args:{variant:"outlined",title:"Card com Borda",children:"<p>Card com borda sutil, bom para separar seções.</p>"}},s={args:{variant:"interactive",clickable:!0,title:"Card Clicável",children:"<p>Passe o mouse ou use Tab para ver os estados de hover e focus.</p>"}},r={render:()=>`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <article class="ds-card ds-card-sm ds-card-p-sm">
        <div class="ds-card-body">
          <strong>Small</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">Card compacto para informações resumidas.</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-md ds-card-p-md">
        <div class="ds-card-body">
          <strong>Medium</strong>
          <p style="margin-top: 0.5rem;">Tamanho padrão para a maioria dos casos de uso.</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-lg ds-card-p-lg">
        <div class="ds-card-body">
          <strong>Large</strong>
          <p style="margin-top: 0.75rem;">Card grande para conteúdo detalhado ou formulários.</p>
        </div>
      </article>
    </div>
  `},t={render:()=>`
    <article class="ds-card ds-card-md ds-card-elevated">
      <header class="ds-card-header">
        <h3 class="ds-card-title">Título do Card</h3>
        <span class="ds-card-subtitle">Subtítulo ou descrição</span>
      </header>
      
      <div class="ds-card-body">
        <p>Conteúdo principal do card. Pode conter texto, imagens, formulários, etc.</p>
        <ul style="margin-top: 0.5rem; padding-left: 1rem;">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
      
      <footer class="ds-card-footer">
        <button class="ds-btn ds-btn-primary ds-btn-sm">Ação Principal</button>
        <button class="ds-btn ds-btn-outline ds-btn-sm">Secundária</button>
      </footer>
    </article>
  `},o={render:()=>`
    <style>
      .ds-card-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      @media (min-width: 640px) {
        .ds-card-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (min-width: 1024px) {
        .ds-card-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    </style>
    
    <div class="ds-card-grid">
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 1</h4>
          <p>Conteúdo do card 1</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 2</h4>
          <p>Conteúdo do card 2</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 3</h4>
          <p>Conteúdo do card 3</p>
        </div>
      </article>
    </div>
  `},c={render:()=>`
    <article class="ds-card ds-card-md ds-card-elevated">
      <div class="ds-card-image" style="height: 160px; background: linear-gradient(135deg, #1a3a5c, #4f8ec8); border-radius: 8px 8px 0 0;"></div>
      <div class="ds-card-body ds-card-p-md">
        <h3 class="ds-card-title">Card com Imagem</h3>
        <p>Imagem de destaque no topo do card.</p>
      </div>
    </article>
  `},n={render:()=>`
    <article class="ds-card ds-card-md ds-card-outlined">
      <header class="ds-card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3 class="ds-card-title" style="margin: 0;">Processo Judicial</h3>
        <span class="ds-badge ds-badge-success">Ativo</span>
      </header>
      <div class="ds-card-body">
        <p><strong>Nº:</strong> 0012345-67.2024.8.26.0000</p>
        <p><strong>Cliente:</strong> João da Silva</p>
        <p><strong>Status:</strong> Em análise</p>
      </div>
    </article>
  `},i={render:()=>`
    <article class="ds-card ds-card-md ds-card-p-md">
      <div class="ds-skeleton ds-skeleton-text" style="width: 60%; height: 24px; margin-bottom: 0.5rem;"></div>
      <div class="ds-skeleton ds-skeleton-text" style="width: 90%; height: 16px; margin-bottom: 0.25rem;"></div>
      <div class="ds-skeleton ds-skeleton-text" style="width: 80%; height: 16px;"></div>
    </article>
  `},l={render:()=>`
    <style>
      .ds-card-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      @media (min-width: 768px) {
        .ds-card-stack {
          flex-direction: row;
        }
      }
    </style>
    
    <div class="ds-card-stack">
      <article class="ds-card ds-card-elevated" style="flex: 1;">
        <div class="ds-card-body">
          <h4>Card 1</h4>
          <p>Empilhado em mobile, lado a lado em tablet+</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-elevated" style="flex: 1;">
        <div class="ds-card-body">
          <h4>Card 2</h4>
          <p>Empilhado em mobile, lado a lado em tablet+</p>
        </div>
      </article>
    </div>
  `};var u,g,v,h,b;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    title: 'Card Padrão',
    children: '<p>Este é um card simples, ideal para listas e grids de conteúdo.</p>'
  }
}`,...(v=(g=a.parameters)==null?void 0:g.docs)==null?void 0:v.source},description:{story:`### Default\r
Card padrão sem elevação`,...(b=(h=a.parameters)==null?void 0:h.docs)==null?void 0:b.description}}};var y,C,f,x,k;e.parameters={...e.parameters,docs:{...(y=e.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    variant: 'elevated',
    title: 'Card Elevado',
    children: '<p>Card com sombra para destacar conteúdo importante.</p>'
  }
}`,...(f=(C=e.parameters)==null?void 0:C.docs)==null?void 0:f.source},description:{story:`### Elevated\r
Card com sombra (elevado)`,...(k=(x=e.parameters)==null?void 0:x.docs)==null?void 0:k.description}}};var S,E,w,I,P;d.parameters={...d.parameters,docs:{...(S=d.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    variant: 'outlined',
    title: 'Card com Borda',
    children: '<p>Card com borda sutil, bom para separar seções.</p>'
  }
}`,...(w=(E=d.parameters)==null?void 0:E.docs)==null?void 0:w.source},description:{story:`### Outlined\r
Card com borda`,...(P=(I=d.parameters)==null?void 0:I.docs)==null?void 0:P.description}}};var T,A,$,z,L;s.parameters={...s.parameters,docs:{...(T=s.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    variant: 'interactive',
    clickable: true,
    title: 'Card Clicável',
    children: '<p>Passe o mouse ou use Tab para ver os estados de hover e focus.</p>'
  }
}`,...($=(A=s.parameters)==null?void 0:A.docs)==null?void 0:$.source},description:{story:`### Interactive\r
Card interativo (hover + focus)`,...(L=(z=s.parameters)==null?void 0:z.docs)==null?void 0:L.description}}};var W,B,M,q,D;r.parameters={...r.parameters,docs:{...(W=r.parameters)==null?void 0:W.docs,source:{originalSource:`{
  render: () => \`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <article class="ds-card ds-card-sm ds-card-p-sm">
        <div class="ds-card-body">
          <strong>Small</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">Card compacto para informações resumidas.</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-md ds-card-p-md">
        <div class="ds-card-body">
          <strong>Medium</strong>
          <p style="margin-top: 0.5rem;">Tamanho padrão para a maioria dos casos de uso.</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-lg ds-card-p-lg">
        <div class="ds-card-body">
          <strong>Large</strong>
          <p style="margin-top: 0.75rem;">Card grande para conteúdo detalhado ou formulários.</p>
        </div>
      </article>
    </div>
  \`
}`,...(M=(B=r.parameters)==null?void 0:B.docs)==null?void 0:M.source},description:{story:`### Tamanhos\r
Comparativo de tamanhos`,...(D=(q=r.parameters)==null?void 0:q.docs)==null?void 0:D.description}}};var G,J,O,R,F;t.parameters={...t.parameters,docs:{...(G=t.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => \`
    <article class="ds-card ds-card-md ds-card-elevated">
      <header class="ds-card-header">
        <h3 class="ds-card-title">Título do Card</h3>
        <span class="ds-card-subtitle">Subtítulo ou descrição</span>
      </header>
      
      <div class="ds-card-body">
        <p>Conteúdo principal do card. Pode conter texto, imagens, formulários, etc.</p>
        <ul style="margin-top: 0.5rem; padding-left: 1rem;">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
      
      <footer class="ds-card-footer">
        <button class="ds-btn ds-btn-primary ds-btn-sm">Ação Principal</button>
        <button class="ds-btn ds-btn-outline ds-btn-sm">Secundária</button>
      </footer>
    </article>
  \`
}`,...(O=(J=t.parameters)==null?void 0:J.docs)==null?void 0:O.source},description:{story:`### Com Header e Footer\r
Estrutura completa`,...(F=(R=t.parameters)==null?void 0:R.docs)==null?void 0:F.description}}};var H,j,N,_,V;o.parameters={...o.parameters,docs:{...(H=o.parameters)==null?void 0:H.docs,source:{originalSource:`{
  render: () => \`
    <style>
      .ds-card-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      @media (min-width: 640px) {
        .ds-card-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (min-width: 1024px) {
        .ds-card-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    </style>
    
    <div class="ds-card-grid">
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 1</h4>
          <p>Conteúdo do card 1</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 2</h4>
          <p>Conteúdo do card 2</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-outlined">
        <div class="ds-card-body">
          <h4>Card 3</h4>
          <p>Conteúdo do card 3</p>
        </div>
      </article>
    </div>
  \`
}`,...(N=(j=o.parameters)==null?void 0:j.docs)==null?void 0:N.source},description:{story:`### Grid Responsivo\r
Layout que adapta de mobile para desktop`,...(V=(_=o.parameters)==null?void 0:_.docs)==null?void 0:V.description}}};var K,Q,U,X,Y;c.parameters={...c.parameters,docs:{...(K=c.parameters)==null?void 0:K.docs,source:{originalSource:`{
  render: () => \`
    <article class="ds-card ds-card-md ds-card-elevated">
      <div class="ds-card-image" style="height: 160px; background: linear-gradient(135deg, #1a3a5c, #4f8ec8); border-radius: 8px 8px 0 0;"></div>
      <div class="ds-card-body ds-card-p-md">
        <h3 class="ds-card-title">Card com Imagem</h3>
        <p>Imagem de destaque no topo do card.</p>
      </div>
    </article>
  \`
}`,...(U=(Q=c.parameters)==null?void 0:Q.docs)==null?void 0:U.source},description:{story:`### Com Imagem\r
Card com imagem de destaque`,...(Y=(X=c.parameters)==null?void 0:X.docs)==null?void 0:Y.description}}};var Z,aa,ea,da,sa;n.parameters={...n.parameters,docs:{...(Z=n.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  render: () => \`
    <article class="ds-card ds-card-md ds-card-outlined">
      <header class="ds-card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h3 class="ds-card-title" style="margin: 0;">Processo Judicial</h3>
        <span class="ds-badge ds-badge-success">Ativo</span>
      </header>
      <div class="ds-card-body">
        <p><strong>Nº:</strong> 0012345-67.2024.8.26.0000</p>
        <p><strong>Cliente:</strong> João da Silva</p>
        <p><strong>Status:</strong> Em análise</p>
      </div>
    </article>
  \`
}`,...(ea=(aa=n.parameters)==null?void 0:aa.docs)==null?void 0:ea.source},description:{story:`### Status Badge\r
Card com indicador de status`,...(sa=(da=n.parameters)==null?void 0:da.docs)==null?void 0:sa.description}}};var ra,ta,oa,ca,na;i.parameters={...i.parameters,docs:{...(ra=i.parameters)==null?void 0:ra.docs,source:{originalSource:`{
  render: () => \`
    <article class="ds-card ds-card-md ds-card-p-md">
      <div class="ds-skeleton ds-skeleton-text" style="width: 60%; height: 24px; margin-bottom: 0.5rem;"></div>
      <div class="ds-skeleton ds-skeleton-text" style="width: 90%; height: 16px; margin-bottom: 0.25rem;"></div>
      <div class="ds-skeleton ds-skeleton-text" style="width: 80%; height: 16px;"></div>
    </article>
  \`
}`,...(oa=(ta=i.parameters)==null?void 0:ta.docs)==null?void 0:oa.source},description:{story:`### Skeleton Loading\r
Estado de carregamento`,...(na=(ca=i.parameters)==null?void 0:ca.docs)==null?void 0:na.description}}};var ia,la,pa,ma,ua;l.parameters={...l.parameters,docs:{...(ia=l.parameters)==null?void 0:ia.docs,source:{originalSource:`{
  render: () => \`
    <style>
      .ds-card-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      
      @media (min-width: 768px) {
        .ds-card-stack {
          flex-direction: row;
        }
      }
    </style>
    
    <div class="ds-card-stack">
      <article class="ds-card ds-card-elevated" style="flex: 1;">
        <div class="ds-card-body">
          <h4>Card 1</h4>
          <p>Empilhado em mobile, lado a lado em tablet+</p>
        </div>
      </article>
      
      <article class="ds-card ds-card-elevated" style="flex: 1;">
        <div class="ds-card-body">
          <h4>Card 2</h4>
          <p>Empilhado em mobile, lado a lado em tablet+</p>
        </div>
      </article>
    </div>
  \`
}`,...(pa=(la=l.parameters)==null?void 0:la.docs)==null?void 0:pa.source},description:{story:`### Mobile Stack\r
Empilhado em mobile, lado a lado em desktop`,...(ua=(ma=l.parameters)==null?void 0:ma.docs)==null?void 0:ua.description}}};const ka=["Default","Elevated","Outlined","Interactive","Sizes","WithHeaderFooter","ResponsiveGrid","WithImage","WithStatusBadge","SkeletonLoading","MobileStack"];export{a as Default,e as Elevated,s as Interactive,l as MobileStack,d as Outlined,o as ResponsiveGrid,r as Sizes,i as SkeletonLoading,t as WithHeaderFooter,c as WithImage,n as WithStatusBadge,ka as __namedExportsOrder,xa as default};
