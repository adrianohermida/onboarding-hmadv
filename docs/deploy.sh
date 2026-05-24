#!/bin/bash
set -e  # interrompe em caso de erro

# 🚀 Configurações de performance para grandes volumes
git config --global http.postBuffer 524288000   # aumenta buffer para 500MB
git config --global core.compression 0          # desativa compressão para acelerar

# 🛠️ Atualiza branch principal
echo "📥 Atualizando branch main..."
git checkout main
git pull origin main

# 📂 Adiciona todos os arquivos modificados
echo "➕ Adicionando arquivos..."
git add -A

# 📝 Commit consolidado
echo "📝 Criando commit..."
git commit -m "chore: consolidação final de todas as alterações"

# 📤 Push com verbose para acompanhar progresso
echo "📤 Enviando alterações para o repositório remoto..."
git push origin main --verbose

# 🏗️ Build principal
echo "🏗️ Executando build principal..."
npm run build

# 🔀 Criação de Pull Request via GitHub CLI
echo "🔀 Criando Pull Request..."
gh pr create --title "Título" --body "Descrição" --base main

# 🌐 Build específico para apps/web
echo "🌐 Executando build em apps/web..."
cd apps/web && npm run build

echo "✅ Deploy concluído com sucesso!"
