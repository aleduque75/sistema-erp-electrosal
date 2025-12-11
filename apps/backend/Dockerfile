# apps/backend/Dockerfile

# Fase 1: Builder (onde o código é compilado e dependências instaladas)
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar pnpm globalmente para usar no build
RUN npm install -g pnpm@9.0.6

# Instalar openssl para o Prisma funcionar corretamente em Alpine
RUN apk add --no-cache openssl

# Copiar arquivos de manifesto para cache de dependências
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/ ./
COPY apps/frontend/package.json apps/frontend/ ./
COPY packages/core/package.json packages/core/ ./

# Copiar todo o código-fonte do monorepo
COPY . .

# Instalar todas as dependências do monorepo
RUN pnpm install --frozen-lockfile

# Gerar o cliente Prisma (necessário para a compilação do NestJS)
RUN DATABASE_URL="postgresql://aleduque:testpassword123@db:5432/sistema_beleza?schema=public" pnpm prisma generate --schema ./apps/backend/prisma/schema.prisma

# Construir o backend NestJS
RUN pnpm --filter backend build

# Compilar o script de seed para JavaScript puro
RUN npx tsc --project apps/backend/tsconfig.seed.json

# Fase 2: Runner (imagem de produção final e enxuta)
FROM node:20
WORKDIR /app
ENV NODE_ENV=production

# Instalar pnpm globalmente na imagem final (para comandos de execução, como o seed manual)
RUN npm install -g pnpm@9.0.6

# Copiar manifestos da raiz para a imagem final
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copiar pacotes específicos da raiz para a imagem final
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json

# Instalar APENAS as dependências de produção
RUN pnpm install --production --frozen-lockfile

# Instalar dependências necessárias para o Puppeteer (usado para gerar PDFs)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \    
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

# Copiar os arquivos compilados do backend
COPY --from=builder /app/apps/backend/dist ./dist

# Copiar o schema.prisma para a imagem final (necessário em runtime)
COPY --from=builder /app/apps/backend/prisma/schema.prisma ./prisma/schema.prisma

# Copiar o script de seed COMPILADO para a imagem final
COPY --from=builder /app/apps/backend/dist/prisma/seed.js ./dist/prisma/seed.js

EXPOSE 3001

# Definir o comando de inicialização
# A DATABASE_URL é injetada aqui para garantir que o Node a veja em runtime
CMD ["sh", "-c", "DATABASE_URL=\"postgresql://aleduque:testpassword123@db:5432/sistema_beleza?schema=public\" node dist/main"]