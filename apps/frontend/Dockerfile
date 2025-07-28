
# Fase 1: Construir a aplicação
FROM node:18-alpine AS builder
WORKDIR /app

# Otimização de cache: copie apenas os manifestos de pacote primeiro
COPY package.json yarn.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/core/package.json ./packages/core/

# Instale todas as dependências
RUN yarn install --frozen-lockfile

# Copie o resto do código-fonte
COPY . .

# Construa o frontend
RUN yarn workspace frontend build

# Fase 2: Criar a imagem de produção final e enxuta
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copie o servidor standalone e suas dependências
COPY --from=builder /app/apps/frontend/.next/standalone ./ 

# Copie a pasta de assets públicos
COPY --from=builder /app/apps/frontend/public ./public

# A CORREÇÃO CRÍTICA: Copie explicitamente a pasta de assets estáticos
COPY --from=builder /app/apps/frontend/.next/static ./_next/static

EXPOSE 3000

# Inicie o servidor
CMD ["node", "server.js"]
