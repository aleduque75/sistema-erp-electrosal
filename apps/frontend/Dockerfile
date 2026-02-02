# Fase 1: Builder
FROM node:20 AS builder
WORKDIR /app
RUN npm install -g pnpm@9.0.6
COPY . .
RUN pnpm install --frozen-lockfile

# Build do Core e do Frontend
RUN pnpm --filter "@sistema-erp-electrosal/core" build
RUN pnpm --filter frontend build

# Fase 2: Runner
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# O modo standalone do Next.js gera uma estrutura específica.
# Copiamos a pasta standalone para a raiz do runner.
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000

# CORREÇÃO DO CMD: No modo standalone, o ponto de entrada é o server.js
# dentro da pasta do aplicativo.
CMD ["node", "apps/frontend/server.js"]