/* empty css                */const m={title:"Componentes/Cards",tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","elevated","outlined","interactive"],description:"Variante visual do card"},size:{control:"select",options:["sm","md","lg","full"],description:"Tamanho do card"},padding:{control:"select",options:["none","sm","md","lg"],description:"Espaçamento interno"},clickable:{control:"boolean",description:"Card clicável (interativo)"}},args:{variant:"default",size:"md",padding:"md",clickable:!1},parameters:{docs:{description:{component:`## Cards do Design System Recupera Empresas\r
\r
Cards responsivos mobile-first com:\r
- Layout adaptativo (stack em mobile, grid em desktop)\r
- Suporte a dark mode\r
- Acessibilidade WCAG AA\r
- Estados de hover e focus`}}}},e={args:{title:"Card Padrão",children:"<p>Este é um card simples, ideal para listas e grids de conteúdo.</p>"}},a={args:{variant:"elevated",title:"Card Elevado",children:"<p>Card com sombra para destacar conteúdo importante.</p>"}},d={args:{variant:"outlined",title:"Card com Borda",children:"<p>Card com borda sutil, bom para separar seções.</p>"}},s={args:{variant:"interactive",clickable:!0,title:"Card Clicável",children:"<p>Passe o mouse ou use Tab para ver os estados de hover e focus.</p>"}},r={render:()=>`
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
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'Card Padrão',
    children: '<p>Este é um card simples, ideal para listas e grids de conteúdo.</p>'
  }
}`,...e.parameters?.docs?.source},description:{story:`### Default\r
Card padrão sem elevação`,...e.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'elevated',
    title: 'Card Elevado',
    children: '<p>Card com sombra para destacar conteúdo importante.</p>'
  }
}`,...a.parameters?.docs?.source},description:{story:`### Elevated\r
Card com sombra (elevado)`,...a.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'outlined',
    title: 'Card com Borda',
    children: '<p>Card com borda sutil, bom para separar seções.</p>'
  }
}`,...d.parameters?.docs?.source},description:{story:`### Outlined\r
Card com borda`,...d.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'interactive',
    clickable: true,
    title: 'Card Clicável',
    children: '<p>Passe o mouse ou use Tab para ver os estados de hover e focus.</p>'
  }
}`,...s.parameters?.docs?.source},description:{story:`### Interactive\r
Card interativo (hover + focus)`,...s.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
}`,...r.parameters?.docs?.source},description:{story:`### Tamanhos\r
Comparativo de tamanhos`,...r.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source},description:{story:`### Com Header e Footer\r
Estrutura completa`,...t.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...o.parameters?.docs?.source},description:{story:`### Grid Responsivo\r
Layout que adapta de mobile para desktop`,...o.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <article class="ds-card ds-card-md ds-card-elevated">
      <div class="ds-card-image" style="height: 160px; background: linear-gradient(135deg, #1a3a5c, #4f8ec8); border-radius: 8px 8px 0 0;"></div>
      <div class="ds-card-body ds-card-p-md">
        <h3 class="ds-card-title">Card com Imagem</h3>
        <p>Imagem de destaque no topo do card.</p>
      </div>
    </article>
  \`
}`,...c.parameters?.docs?.source},description:{story:`### Com Imagem\r
Card com imagem de destaque`,...c.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
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
}`,...n.parameters?.docs?.source},description:{story:`### Status Badge\r
Card com indicador de status`,...n.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => \`
    <article class="ds-card ds-card-md ds-card-p-md">
      <div class="ds-skeleton ds-skeleton-text" style="width: 60%; height: 24px; margin-bottom: 0.5rem;"></div>
      <div class="ds-skeleton ds-skeleton-text" style="width: 90%; height: 16px; margin-bottom: 0.25rem;"></div>
      <div class="ds-skeleton ds-skeleton-text" style="width: 80%; height: 16px;"></div>
    </article>
  \`
}`,...i.parameters?.docs?.source},description:{story:`### Skeleton Loading\r
Estado de carregamento`,...i.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
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
}`,...l.parameters?.docs?.source},description:{story:`### Mobile Stack\r
Empilhado em mobile, lado a lado em desktop`,...l.parameters?.docs?.description}}};const u=["Default","Elevated","Outlined","Interactive","Sizes","WithHeaderFooter","ResponsiveGrid","WithImage","WithStatusBadge","SkeletonLoading","MobileStack"];export{e as Default,a as Elevated,s as Interactive,l as MobileStack,d as Outlined,o as ResponsiveGrid,r as Sizes,i as SkeletonLoading,t as WithHeaderFooter,c as WithImage,n as WithStatusBadge,u as __namedExportsOrder,m as default};
