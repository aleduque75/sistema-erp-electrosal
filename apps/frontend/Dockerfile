# apps/frontend/Dockerfile

# Fase 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar pnpm globalmente para usar no build
RUN npm install -g pnpm@9.0.6

# Copiar manifestos de pacote para cache de dependências
COPY package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json apps/frontend/

# Copiar todo o código-fonte do monorepo
COPY . .

# Instalar todas as dependências do monorepo
RUN pnpm install

# Definir NEXT_PUBLIC_API_URL explicitamente para o build do Next.js
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

# Construir o frontend
RUN pnpm --filter frontend build

# Fase 2: Runner
FROM node:20
WORKDIR /app
ENV NODE_ENV=production

# Instalar pnpm globalmente na imagem final
RUN npm install -g pnpm@9.0.6

# Copiar manifestos da raiz para a imagem final
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copiar node_modules da fase builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar os arquivos compilados do frontend (standalone, public, static)
COPY --from=builder /app/apps/frontend/.next/standalone/ ./apps/frontend/.next/standalone/
COPY --from=builder /app/apps/frontend/public/ ./apps/frontend/public/
COPY --from=builder /app/apps/frontend/.next/static/ ./apps/frontend/.next/static/

EXPOSE 3000

# Comando final para iniciar a aplicação Next.js

CMD ["pnpm", "--filter", "frontend", "start"]