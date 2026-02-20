#!/bin/bash

# Faz o script parar se qualquer comando der erro
set -e

# Garante que pnpm e pm2 estejam no PATH
export PATH=$PATH:/usr/bin:/usr/local/bin
export PNPM_HOME="/root/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

echo "🚀 Iniciando Deploy Seguro - Electrosal"
echo ""
echo "⚠️  ATENÇÃO: Banco compartilhado com n8n!"
echo "    Usando 'prisma migrate deploy' para segurança"
echo ""

# ============================================
# 1. Sincronização com GitHub
# ============================================
echo "📥 Sincronizando com o GitHub..."
git fetch origin main

# ⚠️ CUIDADO: --hard apaga mudanças locais!
git reset --hard origin/main

# ============================================
# 2. Dependências
# ============================================
echo "📦 Instalando dependências..."
pnpm install

# ============================================
# 3. Prisma - BANCO COMPARTILHADO COM N8N
# ============================================
echo "🗄️ Aplicando migrations do Prisma (seguro)..."
echo "   Usando 'migrate deploy' para NÃO apagar tabelas do n8n"

# Garante que estamos no diretório raiz
cd "$(dirname "$0")"

# Navega para o backend
cd apps/backend

# ✅ USA MIGRATE DEPLOY (seguro, não apaga tabelas)
# ❌ NUNCA use 'db push' em produção com banco compartilhado!
npx prisma migrate deploy

# Gera o Prisma Client
npx prisma generate

# Volta para raiz
cd ../..

# ============================================
# 4. Build Backend
# ============================================
echo "🔨 Compilando Backend..."
cd apps/backend
rm -rf dist
pnpm build
cd ../..

# ============================================
# 5. Build Frontend
# ============================================
echo "🔨 Compilando Frontend (Next.js)..."

# Garante caminho correto
if [ -d "apps/frontend" ]; then
  cd apps/frontend
  rm -rf .next
  pnpm build

  # ⚠️ IMPORTANTE: Next.js standalone NÃO copia public e static automaticamente!
  echo "📁 Copiando pasta public para standalone..."
  cp -r public .next/standalone/apps/frontend/public || true

  echo "📁 Copiando pasta static para standalone..."
  cp -r .next/static .next/standalone/apps/frontend/.next/static || true

  cd ../..
else
  echo "❌ ERRO: Diretório apps/frontend não encontrado!"
  echo "   Caminho atual: $(pwd)"
  exit 1
fi

# ============================================
# 6. Reload PM2 (sem downtime)
# ============================================
echo "🔄 Recarregando processos no PM2..."

# Usa 'reload' em vez de 'restart' para zero-downtime
# Note: o nome do arquivo foi corrigido para carregar ambos os apps
pm2 reload ecosystem.config.js --update-env

# Salva configuração
pm2 save

# ============================================
# 7. Verificação
# ============================================
echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo "🔍 Verificando status..."
pm2 status

echo ""
echo "🌐 Acessos:"
echo "   - Frontend: https://electrosal.com.br"
echo "   - API: https://api.electrosal.com.br/api/health"
echo "   - Editor: https://electrosal.com.br/landing-page-manager"
echo ""
echo "📊 Ver logs:"
echo "   pm2 logs"
echo ""
