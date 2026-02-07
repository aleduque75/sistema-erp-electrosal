#!/bin/bash

# Faz o script parar se qualquer comando der erro
set -e

echo "🚀 Iniciando Deploy Seguro - Electrosal"

# 1. Resolve divergências e puxa atualizações
echo "📥 Sincronizando com o GitHub (Forçando versão oficial)..."
git fetch origin main
# O comando abaixo apaga divergências locais e iguala a VPS ao GitHub
git reset --hard origin/main

# 2. Instala dependências
echo "📦 Instalando dependências..."
pnpm install

# 3. Sincroniza o Banco de Dados
echo "🗄️ Sincronizando Schema do Prisma..."
# Usando a variável de ambiente para garantir a conexão
export DATABASE_URL="postgresql://admin:Electrosal123@127.0.0.1:5432/erp_electrosal?schema=public"
cd apps/backend && npx prisma db push && cd ../..

# 4. Build do Backend
echo "🔨 Compilando Backend..."
cd apps/backend && rm -rf dist && pnpm build && cd ../..

# 5. Build do Frontend
echo "🔨 Compilando Frontend (Next.js)..."
cd apps/frontend && rm -rf .next && pnpm build && cd ../..

# 6. Reinicia processos no PM2
echo "🔄 Reiniciando processos no PM2..."
# Usamos 'restart' para garantir que o código novo entre em vigor
pm2 restart erp-backend --update-env
pm2 restart erp-frontend --update-env

echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"

echo "🌐 Acesse: https://erp.electrosal.com.br"
