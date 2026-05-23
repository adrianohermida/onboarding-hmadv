/* empty css                */function We({type:h,size:Ae,state:x,label:Ge,placeholder:He,helperText:y,required:f}){const g=x==="error";return`
    <div class="ds-form-group" style="max-width: 400px;">
      <label class="ds-label ${f?"is-required":""}" for="input-${h}">
        ${Ge}
        ${f?'<span class="ds-required">*</span>':""}
      </label>

      <input
        type="${h}"
        id="input-${h}"
        class="ds-input ds-input-${Ae} ${g?"is-error":""} ${x==="focus"?"is-focused":""}"
        placeholder="${He}"
        ${x==="disabled"?"disabled":""}
        ${f?"required":""}
        ${g?'aria-invalid="true"':""}
      />

      ${y||g?`<span class="ds-helper-text ${g?"is-error":""}">${y||"Campo inválido"}</span>`:""}
    </div>
  `}const Je={title:"Componentes/Inputs",tags:["autodocs"],render:We,argTypes:{type:{control:"select",options:["text","email","password","number","tel","date","search"],description:"Tipo do input"},size:{control:"select",options:["sm","md","lg"],description:"Tamanho do input"},state:{control:"select",options:["default","focus","error","disabled"],description:"Estado do input"},label:{control:"text",description:"Label do campo"},placeholder:{control:"text",description:"Placeholder text"},helperText:{control:"text",description:"Texto de ajuda"},required:{control:"boolean",description:"Campo obrigatório"}},args:{type:"text",size:"md",state:"default",label:"Nome Completo",placeholder:"Digite seu nome",helperText:"",required:!1}},e={args:{type:"text",label:"Nome Completo",placeholder:"Digite seu nome"}},s={args:{type:"email",label:"E-mail",placeholder:"seu@email.com",helperText:"Enviaremos confirmação para este e-mail"}},a={args:{type:"password",label:"Senha",placeholder:"••••••••",helperText:"Mínimo 8 caracteres"}},r={args:{type:"number",label:"Idade",placeholder:"0"}},t={args:{type:"tel",label:"Telefone",placeholder:"(11) 99999-9999",helperText:"Formato: (XX) XXXXX-XXXX"}},l={args:{type:"date",label:"Data de Nascimento"}},n={render:()=>`
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
  `};var v,w,S,T,C;e.parameters={...e.parameters,docs:{...(v=e.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    type: 'text',
    label: 'Nome Completo',
    placeholder: 'Digite seu nome'
  }
}`,...(S=(w=e.parameters)==null?void 0:w.docs)==null?void 0:S.source},description:{story:`### Text Input\r
Campo de texto padrão`,...(C=(T=e.parameters)==null?void 0:T.docs)==null?void 0:C.description}}};var q,X,E,I,N;s.parameters={...s.parameters,docs:{...(q=s.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    type: 'email',
    label: 'E-mail',
    placeholder: 'seu@email.com',
    helperText: 'Enviaremos confirmação para este e-mail'
  }
}`,...(E=(X=s.parameters)==null?void 0:X.docs)==null?void 0:E.source},description:{story:`### Email Input\r
Validação de email`,...(N=(I=s.parameters)==null?void 0:I.docs)==null?void 0:N.description}}};var z,D,$,P,F;a.parameters={...a.parameters,docs:{...(z=a.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    type: 'password',
    label: 'Senha',
    placeholder: '••••••••',
    helperText: 'Mínimo 8 caracteres'
  }
}`,...($=(D=a.parameters)==null?void 0:D.docs)==null?void 0:$.source},description:{story:`### Password Input\r
Campo de senha`,...(F=(P=a.parameters)==null?void 0:P.docs)==null?void 0:F.description}}};var M,B,L,O,k;r.parameters={...r.parameters,docs:{...(M=r.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    type: 'number',
    label: 'Idade',
    placeholder: '0'
  }
}`,...(L=(B=r.parameters)==null?void 0:B.docs)==null?void 0:L.source},description:{story:`### Number Input\r
Apenas números`,...(k=(O=r.parameters)==null?void 0:O.docs)==null?void 0:k.description}}};var R,A,G,H,W;t.parameters={...t.parameters,docs:{...(R=t.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    type: 'tel',
    label: 'Telefone',
    placeholder: '(11) 99999-9999',
    helperText: 'Formato: (XX) XXXXX-XXXX'
  }
}`,...(G=(A=t.parameters)==null?void 0:A.docs)==null?void 0:G.source},description:{story:`### Tel Input\r
Telefone (mobile optimized)`,...(W=(H=t.parameters)==null?void 0:H.docs)==null?void 0:W.description}}};var j,_,V,J,K;l.parameters={...l.parameters,docs:{...(j=l.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    type: 'date',
    label: 'Data de Nascimento'
  }
}`,...(V=(_=l.parameters)==null?void 0:_.docs)==null?void 0:V.source},description:{story:`### Date Input\r
Seletor de data`,...(K=(J=l.parameters)==null?void 0:J.docs)==null?void 0:K.description}}};var Q,U,Y,Z,ee;n.parameters={...n.parameters,docs:{...(Q=n.parameters)==null?void 0:Q.docs,source:{originalSource:`{
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
}`,...(Y=(U=n.parameters)==null?void 0:U.docs)==null?void 0:Y.source},description:{story:`### Search Input\r
Busca com ícone`,...(ee=(Z=n.parameters)==null?void 0:Z.docs)==null?void 0:ee.description}}};var se,ae,re,te,le;o.parameters={...o.parameters,docs:{...(se=o.parameters)==null?void 0:se.docs,source:{originalSource:`{
  args: {
    type: 'email',
    state: 'error',
    label: 'E-mail',
    placeholder: 'seu@email.com',
    helperText: 'Por favor, insira um e-mail válido'
  }
}`,...(re=(ae=o.parameters)==null?void 0:ae.docs)==null?void 0:re.source},description:{story:`### Error State\r
Com mensagem de erro`,...(le=(te=o.parameters)==null?void 0:te.docs)==null?void 0:le.description}}};var ne,oe,ie,de,pe;i.parameters={...i.parameters,docs:{...(ne=i.parameters)==null?void 0:ne.docs,source:{originalSource:`{
  args: {
    type: 'text',
    state: 'disabled',
    label: 'CPF (somente leitura)',
    placeholder: '000.000.000-00'
  }
}`,...(ie=(oe=i.parameters)==null?void 0:oe.docs)==null?void 0:ie.source},description:{story:`### Disabled State\r
Campo desabilitado`,...(pe=(de=i.parameters)==null?void 0:de.docs)==null?void 0:pe.description}}};var ce,me,ue,be,ge;d.parameters={...d.parameters,docs:{...(ce=d.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  args: {
    type: 'text',
    label: 'Nome Completo',
    placeholder: 'Digite seu nome',
    required: true,
    helperText: 'Campo obrigatório'
  }
}`,...(ue=(me=d.parameters)==null?void 0:me.docs)==null?void 0:ue.source},description:{story:`### Required Field\r
Campo obrigatório`,...(ge=(be=d.parameters)==null?void 0:be.docs)==null?void 0:ge.description}}};var he,xe,fe,ye,ve;p.parameters={...p.parameters,docs:{...(he=p.parameters)==null?void 0:he.docs,source:{originalSource:`{
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
}`,...(fe=(xe=p.parameters)==null?void 0:xe.docs)==null?void 0:fe.source},description:{story:`### Tamanhos\r
Comparativo de tamanhos`,...(ve=(ye=p.parameters)==null?void 0:ye.docs)==null?void 0:ve.description}}};var we,Se,Te,Ce,qe;c.parameters={...c.parameters,docs:{...(we=c.parameters)==null?void 0:we.docs,source:{originalSource:`{
  args: {
    type: 'password',
    label: 'Nova Senha',
    placeholder: '••••••••',
    helperText: 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula e um número'
  }
}`,...(Te=(Se=c.parameters)==null?void 0:Se.docs)==null?void 0:Te.source},description:{story:`### With Helper Text\r
Texto de ajuda`,...(qe=(Ce=c.parameters)==null?void 0:Ce.docs)==null?void 0:qe.description}}};var Xe,Ee,Ie,Ne,ze;m.parameters={...m.parameters,docs:{...(Xe=m.parameters)==null?void 0:Xe.docs,source:{originalSource:`{
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
}`,...(Ie=(Ee=m.parameters)==null?void 0:Ee.docs)==null?void 0:Ie.source},description:{story:`### Input Group\r
Múltiplos inputs relacionados`,...(ze=(Ne=m.parameters)==null?void 0:Ne.docs)==null?void 0:ze.description}}};var De,$e,Pe,Fe,Me;u.parameters={...u.parameters,docs:{...(De=u.parameters)==null?void 0:De.docs,source:{originalSource:`{
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
}`,...(Pe=($e=u.parameters)==null?void 0:$e.docs)==null?void 0:Pe.source},description:{story:`### Mobile Optimized\r
Otimizado para mobile (touch-friendly)`,...(Me=(Fe=u.parameters)==null?void 0:Fe.docs)==null?void 0:Me.description}}};var Be,Le,Oe,ke,Re;b.parameters={...b.parameters,docs:{...(Be=b.parameters)==null?void 0:Be.docs,source:{originalSource:`{
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
}`,...(Oe=(Le=b.parameters)==null?void 0:Le.docs)==null?void 0:Oe.source},description:{story:`### Floating Label\r
Label animado (estilo Material Design)`,...(Re=(ke=b.parameters)==null?void 0:ke.docs)==null?void 0:Re.description}}};const Ke=["Text","Email","Password","Number","Tel","Date","Search","ErrorState","DisabledState","Required","Sizes","WithHelperText","InputGroup","MobileOptimized","FloatingLabel"];export{l as Date,i as DisabledState,s as Email,o as ErrorState,b as FloatingLabel,m as InputGroup,u as MobileOptimized,r as Number,a as Password,d as Required,n as Search,p as Sizes,t as Tel,e as Text,c as WithHelperText,Ke as __namedExportsOrder,Je as default};
