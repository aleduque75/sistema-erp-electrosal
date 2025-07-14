# --- Estágio 1: Builder ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/core/package.json ./packages/core/
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn workspace frontend build

# --- Estágio 2: Runner ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
COPY --from=builder /app/apps/frontend/public ./public
# O .env.local não é usado no Docker, as variáveis vêm do docker-compose

CMD ["node", "server.js"]