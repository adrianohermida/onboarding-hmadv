# 🚀 Guia de Deploy Automático no GitHub

Este documento descreve como configurar e usar o deploy automático para o Portal Superendividado.

## 📋 Pré-requisitos

1. **Repositório no GitHub** com acesso de escrita
2. **GitHub Pages habilitado** nas configurações do repositório
3. **Variáveis de ambiente** configuradas nos Secrets do GitHub

## 🔧 Configuração Inicial

### 1. Habilitar GitHub Pages

1. Acesse `Settings` > `Pages` no seu repositório GitHub
2. Em "Build and deployment":
   - **Source**: Selecione "GitHub Actions"
3. Anote a URL que será gerada (ex: `https://seu-usuario.github.io/seu-repo`)

### 2. Configurar Secrets no GitHub

Acesse `Settings` > `Secrets and variables` > `Actions` e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-supabase
```

### 3. Configurar Environments (Opcional)

Para deploy em ambientes separados (staging/production):

1. Acesse `Settings` > `Environments`
2. Crie os environments:
   - `staging`
   - `production`
   - `github-pages`

## 📁 Workflows Disponíveis

### 1. CI Platform Validation (`ci.yml`)
Executa automaticamente em PRs e pushes para `main`:
- ✅ Instala dependências
- ✅ Roda testes
- ✅ Valida manifests dos módulos
- ✅ Valida compatibilidade shell
- ✅ Valida segurança e contratos tenant

### 2. CD Platform Delivery (`cd.yml`)
Deploy contínuo para staging/production:
- **Trigger**: Push na `main` ou dispatch manual
- **Ambientes**: staging e production
- **Validações**: Todas as validações do CI + build da aplicação

### 3. Auto Deploy to GitHub Pages (`deploy-pages.yml`) ⭐
Deploy automático estático para GitHub Pages:
- **Trigger**: Push na `main` ou dispatch manual
- **Output**: Build estático em `apps/web/out`
- **URL**: `https://seu-usuario.github.io/seu-repo`

## 🚀 Como Usar

### Deploy Automático (Push na main)

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

O workflow `deploy-pages.yml` será executado automaticamente e fará o deploy para GitHub Pages.

### Deploy Manual (Workflow Dispatch)

1. Acesse `Actions` no GitHub
2. Selecione o workflow desejado:
   - "Auto Deploy to GitHub Pages"
   - "CD Platform Delivery"
3. Clique em "Run workflow"
4. Selecione a branch e environment (se aplicável)
5. Clique em "Run workflow"

### Deploy via CLI

```bash
# Usando o script do package.json
npm run deploy

# Ou manualmente
git add -A && git commit -m "deploy: atualizar portal" && git push origin main
```

## 🔍 Monitorando o Deploy

1. Acesse `Actions` no GitHub
2. Clique no workflow em execução
3. Visualize os logs de cada job:
   - `build`: Instalação e build da aplicação
   - `deploy`: Upload para GitHub Pages

## ⚙️ Personalização

### Alterar Diretório de Build

Edite `.github/workflows/deploy-pages.yml`:

```yaml
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./apps/web/out  # Altere se necessário
```

### Adicionar Steps Personalizados

Adicione steps antes do deploy:

```yaml
- name: Custom step
  run: echo "Meu comando personalizado"
```

### Deploy em Múltiplos Ambientes

O workflow `cd.yml` já suporta staging e production. Para adicionar mais:

1. Crie o environment no GitHub Settings
2. Adicione a lógica no workflow:

```yaml
deploy-custom:
  needs: [preflight, build-web]
  runs-on: ubuntu-latest
  environment: custom
  steps:
    - name: Deploy to custom
      run: echo "Deploy custom..."
```

## 🐛 Troubleshooting

### Build Falha

1. Verifique os logs do job `build`
2. Confirme que as variáveis de ambiente estão configuradas
3. Teste o build localmente: `npm run web:build`

### Deploy não Atualiza

1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Verifique se o workflow completou com sucesso
3. Confira se o GitHub Pages está habilitado

### Erro de Permissão

Verifique em `Settings` > `Actions` > `General`:
- **Workflow permissions**: "Read and write permissions"

### Imagens não Carregam

O build estático usa `images.unoptimized: true`. Para imagens otimizadas:
- Use CDN externo
- Ou configure um servidor próprio

## 📊 Status Badges

Adicione ao README.md:

```markdown
![CI](https://github.com/seu-usuario/seu-repo/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/seu-usuario/seu-repo/actions/workflows/cd.yml/badge.svg)
![Deploy](https://github.com/seu-usuario/seu-repo/actions/workflows/deploy-pages.yml/badge.svg)
```

## 🔐 Segurança

- Nunca commite secrets no repositório
- Use GitHub Secrets para todas as credenciais
- Revise permissões dos workflows regularmente
- Habilite proteções de branch para `main`

## 📞 Suporte

Em caso de dúvidas:
1. Consulte a [documentação do GitHub Actions](https://docs.github.com/actions)
2. Verifique os logs detalhados no GitHub
3. Teste localmente antes de push

---

**Última atualização**: Maio 2024
**Versão**: 1.0.0
