# --- Estágio 1: Builder ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/core/package.json ./packages/core/
RUN yarn install --frozen-lockfile
COPY . .
RUN npx prisma generate --schema=./apps/backend/prisma/schema.prisma
RUN yarn workspace @sistema-beleza/core build
RUN yarn workspace backend build

# --- Estágio 2: Runner ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
# Copia o script de entrypoint para dentro da imagem final
COPY ./apps/backend/docker-entrypoint.sh /app/docker-entrypoint.sh

# Define nosso script como o ponto de entrada do container
ENTRYPOINT ["/app/docker-entrypoint.sh"]
RUN npx prisma generate --schema=./prisma/schema.prisma
CMD ["node", "dist/main.js"]