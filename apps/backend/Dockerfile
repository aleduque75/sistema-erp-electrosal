# --- Estágio 1: Builder ---
FROM node:20-slim AS builder
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
RUN npx prisma generate --schema=./apps/backend/prisma/schema.prisma
RUN yarn workspace @sistema-beleza/core build
RUN yarn workspace backend build

# --- Estágio 2: Runner (Produção) ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copia os package.json de todo o monorepo
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder /app/packages/core/package.json ./packages/core/

# <<< CORREÇÃO: Instala APENAS as dependências de produção no ambiente final >>>
RUN yarn install --production --frozen-lockfile

# Copia os artefatos prontos
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma

# Gera o cliente Prisma para a imagem final
RUN npx prisma generate --schema=./prisma/schema.prisma

# Roda o script de entrypoint
COPY ./apps/backend/docker-entrypoint.sh /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]

CMD ["node", "dist/main.js"]