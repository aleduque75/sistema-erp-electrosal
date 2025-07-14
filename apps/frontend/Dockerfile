# --- Estágio 1: Builder ---
FROM node:20-slim AS builder
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn workspace frontend build

# --- Estágio 2: Runner (Produção) ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copia os package.json necessários para a instalação de produção
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/

# <<< CORREÇÃO: Instala APENAS as dependências de produção do frontend no ambiente final >>>
RUN yarn install --production --frozen-lockfile

# Copia apenas a pasta standalone que já contém tudo que precisa
COPY --from=builder /app/apps/frontend/.next/standalone ./

CMD ["node", "server.js"]