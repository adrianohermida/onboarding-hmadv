/* empty css                */if(typeof window<"u"){const o=new URL(window.location.href),e=o.searchParams.get("id");if(e){let t=e;e.startsWith("componentes-botões--")&&(t=e.replace("componentes-botões--","design-system-componentes-botões--")),e.startsWith("componentes-botoes--")&&(t=e.replace("componentes-botoes--","design-system-componentes-botões--")),t!==e&&(o.searchParams.set("id",t),window.history.replaceState({},"",o.toString()))}}const s={parameters:{controls:{matchers:{color:/(background|color)$/i,date:/Date$/i}},viewport:{defaultViewport:"mobile-small"},a11y:{element:"#root",config:{},options:{checks:{"color-contrast":{enabled:!0},"image-alt":{enabled:!0},label:{enabled:!0},"link-name":{enabled:!0}}}},docs:{description:{component:"Componentes do Design System Recupera Empresas - Mobile First com acessibilidade WCAG AA"}},layout:"padded",backgrounds:{default:"light",values:[{name:"light",value:"#ffffff"},{name:"dark",value:"#0f1923"},{name:"brand-primary",value:"#1a3a5c"},{name:"brand-accent",value:"#f5a623"}]}},decorators:[o=>`
      <div class="ds-story-wrapper">
        <style>
          .ds-story-wrapper {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            padding: 1rem;
          }
          
          /* Suporte a dark mode automático */
          @media (prefers-color-scheme: dark) {
            .ds-story-wrapper {
              background: #0f1923;
              color: #e2e8f0;
            }
          }
        </style>
        ${o()}
      </div>
    `],tags:["autodocs"]};export{s as default};
