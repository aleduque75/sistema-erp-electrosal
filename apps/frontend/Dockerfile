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
ENV HOSTNAME="0.0.0.0"

# O Next.js standalone precisa dessas três pastas:
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000

# No modo standalone, o server.js é gerado dentro da pasta do app
CMD ["node", "apps/frontend/server.js"]