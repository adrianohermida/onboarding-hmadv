# Portal do Cliente — Hermida Maia Advocacia

Portal exclusivo para acompanhamento de casos de superendividamento.

**Domínio:** `portal.hermidamaia.adv.br`
**GitHub Pages:** deploy automático via push em `main`

---

## Estrutura

```
/
├── assets/
│   └── logo1.webp     # Marca da águia (SVG escalável)
├── components/                   # Fragmentos HTML injetados pelo app.js
│   ├── header.html
│   ├── sidebar.html
│   ├── status-card.html
│   ├── progress-bar.html
│   └── loading.html
├── pages/
│   ├── login.html               # Acesso passwordless (magic link)
│   ├── auth-callback.html       # Callback do magic link Supabase
│   ├── dashboard.html
│   ├── onboarding.html
│   ├── documentos.html
│   └── dividas.html
├── services/
│   ├── supabase.js              # Cliente Supabase (CDN ESM)
│   ├── auth.js                  # AuthService — magic link, sessão, logout
│   ├── freshdesk.js             # Placeholder Sprint 2
│   └── storage.js               # Wrapper localStorage
├── styles/
│   ├── variables.css            # Tokens: cores, fontes, espaçamento
│   ├── main.css                 # Reset, tipografia, animações
│   ├── layout.css               # Shell, sidebar, header, auth layout
│   └── components.css           # Todos os componentes visuais
├── utils/
│   ├── config.js                # URLs Supabase e domínio do site
│   ├── constants.js             # Rotas, enums, STORAGE_KEYS
│   └── helpers.js               # formatCurrency, showToast, etc.
├── js/
│   ├── app.js                   # Init + auth guard + carregamento de componentes
│   └── router.js                # Links ativos + breadcrumb
└── index.html                   # Entry point — redireciona para login ou dashboard
```

---

## Design System — Hermida Maia

| Token            | Valor       | Uso                              |
|------------------|-------------|----------------------------------|
| `--navy`         | `#1A3A5C`   | Sidebar, headers, fundo login    |
| `--blue`         | `#2E6DA4`   | Ações primárias, links           |
| `--brand-gold`   | `#F5A623`   | Marca Hermida Maia, destaques    |
| `--ok`           | `#1a7a4a`   | Sucesso, aprovado                |
| `--warn`         | `#b45309`   | Atenção, pendente                |
| `--red`          | `#C0392B`   | Erro, dívida abusiva             |
| `--serif`        | Libre Baskerville | Headings, valores financeiros |
| `--sans`         | DM Sans     | Corpo, labels, botões, marca     |

---

## Configuração Supabase Auth (Sprint 1)

Para habilitar o login por magic link:

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → seu projeto
2. **Authentication → Providers → Email**
   - ✅ Enable Email Signup
   - ✅ Enable Confirmations (magic link)
3. **Authentication → URL Configuration**
   - Site URL: `https://portal.hermidamaia.adv.br`
   - Redirect URLs: adicionar `https://portal.hermidamaia.adv.br/pages/auth-callback.html`
4. **(Opcional) Authentication → Email Templates** — personalizar com a marca Hermida Maia
5. Atualizar `utils/config.js` com as credenciais do projeto se usar um novo projeto

---

## Desenvolvimento local

```bash
npm run dev      # Servidor local em http://localhost:3000 (via npx serve)
npm run deploy   # Commit + push → deploy automático no GitHub Pages
```

> O `fetch()` de componentes requer servidor HTTP. Não funciona via `file://`.

---

## Configuração DNS (Vercel / Registro.br)

Para apontar `portal.hermidamaia.adv.br` para o GitHub Pages:

```
Tipo:  CNAME
Host:  portal
Valor: <seu-usuario>.github.io
```

---

## Roadmap

| Sprint | Escopo                                       | Status       |
|--------|----------------------------------------------|--------------|
| 0      | Refatoração estrutural base                  | ✅ Concluído  |
| 1      | Branding Hermida Maia + Autenticação Supabase | ✅ Concluído  |
| 2      | Integração Freshdesk (tickets + contatos)    | 🔜 Próximo   |
| 3      | Upload de documentos                         | 🔜 Planejado |
| 4      | Análise de dívidas e relatórios              | 🔜 Planejado |
