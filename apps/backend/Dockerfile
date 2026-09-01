# Fase 1: Builder
FROM node:20 AS builder
WORKDIR /app
RUN npm install -g pnpm@9.0.6

# Copia tudo para o builder
COPY . .

# Instala tudo (incluindo devDeps)
RUN pnpm install --frozen-lockfile

# 1. Build do Core, geração do Prisma Client e Build do Backend
RUN pnpm --filter "@sistema-erp-electrosal/core" build
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma
RUN pnpm --filter backend build

# 2. O PULO DO GATO: Isola o backend para produção em uma pasta limpa
# Isso resolve todos os problemas de symlinks do pnpm no Docker
RUN pnpm --filter backend --prod deploy /app/deployed-backend

# Fase 2: Runner (Imagem final leve)
FROM node:20
WORKDIR /app
ENV NODE_ENV=production

# Variáveis que garantem que o Prisma use o motor certo no Debian
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary

# Copiamos a pasta isolada que o pnpm deploy criou
COPY --from=builder /app/deployed-backend ./

# Copiamos o schema e o core compilado para os lugares que o Nest espera
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/packages/core/dist ./packages/core/dist

# Dependências e Navegador para Puppeteer (Chromium nativo Debian/ARM64)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Configurações para o Puppeteer usar o Chromium nativo do sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Instalamos o Prisma global
RUN npm install -g prisma@5.22.0

EXPOSE 3001

# Comando final: gera prisma e inicia backend
CMD ["sh", "-c", "prisma generate && node dist/main"]
