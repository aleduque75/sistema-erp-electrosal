# Fase 1: Builder
FROM node:20 AS builder
WORKDIR /app
RUN npm install -g pnpm@9.0.6

# Copia tudo para o builder
COPY . .

# Instala tudo (incluindo devDeps)
RUN pnpm install --frozen-lockfile

# 1. Build do Core e do Backend
RUN pnpm --filter "@sistema-erp-electrosal/core" build
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

# Dependências para Puppeteer/PDFs
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 lsb-release wget xdg-utils && rm -rf /var/lib/apt/lists/*

# Instalamos o Prisma global apenas para rodar o generate no boot
RUN npm install -g prisma@5.12.1

EXPOSE 3001

# Comando final: o prisma agora vai achar o @prisma/client porque a pasta está "plana"
CMD ["sh", "-c", "prisma generate && node dist/main"]
