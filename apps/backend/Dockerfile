# Fase 1: Builder
FROM node:20 AS builder
WORKDIR /app
RUN npm install -g pnpm@9.0.6
COPY . .
RUN pnpm install --frozen-lockfile

# Gerar e Buildar
RUN pnpm --filter "@sistema-erp-electrosal/core" build
RUN pnpm --filter backend build
RUN npx tsc --project apps/backend/tsconfig.seed.json

# Fase 2: Runner
FROM node:20
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm@9.0.6

# Copiar apenas arquivos necessários
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json

# Instalar dependências de produção
RUN pnpm install --production --frozen-lockfile

# --- CORREÇÃO DEFINITIVA PARA O PRISMA ---
# Instalamos o prisma CLI globalmente para garantir que o comando funcione
RUN npm install -g prisma@5.12.1 

# Copiar os compilados e o SCHEMA (fundamental)
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/apps/backend/prisma ./prisma

# Dependências para Puppeteer (PDFs)
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 lsb-release wget xdg-utils && rm -rf /var/lib/apt/lists/*

EXPOSE 3001

# O segredo: Gerar o client no momento que o container sobe
CMD ["sh", "-c", "prisma generate --schema ./prisma/schema.prisma && node dist/main"]