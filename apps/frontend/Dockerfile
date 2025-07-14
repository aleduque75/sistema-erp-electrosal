# --- Estágio 1: Instalação de Dependências ---
FROM node:20-slim AS deps
WORKDIR /app

# Copia apenas os arquivos de definição de pacotes
COPY package.json yarn.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/core/package.json ./packages/core/

# Instala TODAS as dependências do monorepo
RUN yarn install --frozen-lockfile


# --- Estágio 2: Build da Aplicação ---
FROM node:20-slim AS builder
WORKDIR /app

# Copia as dependências já instaladas do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
# Copia todo o código fonte
COPY . .

# Roda o build do frontend
RUN yarn workspace frontend build


# --- Estágio 3: Imagem Final de Produção ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copia apenas os artefatos prontos do estágio de build
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
COPY --from=builder /app/apps/frontend/public ./public

CMD ["node", "server.js"]