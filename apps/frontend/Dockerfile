# apps/frontend/Dockerfile (CORRIGIDO E OTIMIZADO)

# ----------------- Estágio de Build -----------------
# Use uma imagem base mais completa como 'buster' ou 'slim' para evitar problemas de compatibilidade
FROM node:20-slim AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência da raiz do projeto para aproveitar o cache do Docker.
# Se o yarn.lock ou package.json mudar, o Docker só refaz a partir daqui.
COPY package.json yarn.lock ./

# Instala TODAS as dependências do monorepo.
# O Next.js pode precisar de dependências do workspace raiz.
RUN yarn install --frozen-lockfile

# Copia todo o código-fonte do projeto.
COPY . .

# Executa o build do Next.js.
# O Next.js vai gerar o output 'standalone' conforme configurado no next.config.mjs.
RUN yarn workspace frontend build


# ----------------- Estágio de Produção -----------------
FROM node:20-slim

WORKDIR /app

# Define o ambiente como produção
ENV NODE_ENV=production

# Copia os artefatos do build do estágio 'builder'
# O output 'standalone' é autocontido.
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
COPY --from=builder /app/apps/frontend/public ./public

EXPOSE 3000

# O comando para iniciar a aplicação standalone
CMD ["node", "server.js"]