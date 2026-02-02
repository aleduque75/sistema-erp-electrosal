# Fase 1: Builder
FROM node:20 AS builder
WORKDIR /app
RUN npm install -g pnpm@9.0.6

# Copia tudo para o builder
COPY . .

# Instala todas as dependências (incluindo devDeps para build)
RUN pnpm install --frozen-lockfile

# Gera o Prisma Client e faz o Build dos pacotes
RUN pnpm --filter "@sistema-erp-electrosal/core" build
RUN pnpm --filter backend prisma generate
RUN pnpm --filter backend build
RUN npx tsc --project apps/backend/tsconfig.seed.json

# Fase 2: Runner (Imagem final)
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm@9.0.6

# Copia os manifestos para a instalação
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json

# Instala dependências de produção
RUN pnpm install --production --frozen-lockfile --filter backend...

# --- FORÇA A INSTALAÇÃO DOS MÓDULOS FALTANTES ---
RUN pnpm add -w @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
# Dependências para Puppeteer (PDFs)
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 lsb-release wget xdg-utils && rm -rf /var/lib/apt/lists/*

# Copia os arquivos compilados
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

EXPOSE 3001
WORKDIR /app/apps/backend

# Inicia gerando o Prisma e rodando o main.js
CMD ["sh", "-c", "npx prisma generate && node dist/main"]