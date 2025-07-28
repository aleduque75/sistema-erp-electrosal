Documentação do Setup do Monorepo (Next.js, NestJS, PostgreSQL) com Docker
Esta documentação detalha as etapas e correções realizadas para colocar o monorepo (Next.js Frontend, NestJS Backend com Prisma, PostgreSQL DB) em funcionamento usando Docker e Nginx em um ambiente de produção.

1. Visão Geral da Arquitetura
Frontend: Next.js (App Router, output: 'standalone')

Backend: NestJS

Banco de Dados: PostgreSQL (via Docker)

Monorepo Tool: Yarn Workspaces + Turborepo

Proxy Reverso: Nginx (no servidor host)

Ambiente Docker: node:20-alpine para builders, node:20 para runners.

2. Arquivos de Configuração Chave
2.1. .dockerignore (Raiz do Monorepo)
Garanta que o Docker ignore arquivos desnecessários ou sensíveis durante o build.

Caminho: /var/www/sistema-beleza/.dockerignore

Snippet de código

# Ignorar dados do banco de dados
db_data/

# Ignorar dependências e builds
node_modules/
**/node_modules/
.next/
**/.next/
dist/
**/dist/

# Ignorar arquivos de log e sistema
npm-debug.log
yarn-debug.log
yarn-error.log
.DS_Store
.vscode/
.idea/

# Ignorar arquivos de ambiente local
.env
.env.local
.env.development
.env.test
.env.development.local
.env.test.local
.env.production.local
2.2. docker-compose.yml (Raiz do Monorepo)
Define e orquestra os serviços Docker (DB, Backend, Frontend).

Caminho: /var/www/sistema-beleza/docker-compose.yml

YAML

services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: aleduque
      POSTGRES_PASSWORD: testpassword123
      POSTGRES_DB: sistema_beleza
    volumes:
      - ./db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aleduque -d sistema_beleza"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: ./apps/backend/Dockerfile
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: "postgresql://aleduque:testpassword123@db:5432/sistema_beleza?schema=public"
      JWT_SECRET: "seu_jwt_secret_de_producao_super_forte"
      POSTGRES_HOST: db
      POSTGRES_USER: aleduque
      POSTGRES_PASSWORD: testpassword123
      PRISMA_SCHEMA_PATH: ./apps/backend/prisma/schema.prisma # Caminho para o schema.prisma
    depends_on:
      db:
        condition: service_healthy
    command: ["node", "dist/main"] # Mantemos o CMD, migrações são feitas manualmente

  frontend:
    build:
      context: .
      dockerfile: ./apps/frontend/Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://192.168.15.4:81/api # URL da API para o frontend
    depends_on:
      - backend

volumes:
  db_data: {}
2.3. apps/backend/Dockerfile
Define o processo de build para a imagem Docker do backend.

Caminho: /var/www/sistema-beleza/apps/backend/Dockerfile

Dockerfile

# apps/backend/Dockerfile

# Fase 1: Construir a aplicação NestJS
FROM node:20-alpine AS builder
WORKDIR /app

# Copie o package.json e yarn.lock da raiz do monorepo
COPY package.json yarn.lock ./

# Copie o package.json específico do backend
COPY apps/backend/package.json apps/backend/ ./

# Copie TODO o código-fonte do monorepo para a fase builder
COPY . .

# Instale todas as dependências do monorepo
RUN yarn install --frozen-lockfile

# IMPORTANTE: Defina DATABASE_URL diretamente na linha do comando Prisma para o BUILD
# (Para gerar o cliente Prisma, que é necessário para a compilação do NestJS)
RUN DATABASE_URL="postgresql://aleduque:testpassword123@db:5432/sistema_beleza?schema=public" npx prisma generate --schema ./apps/backend/prisma/schema.prisma

# Construa o backend NestJS
RUN yarn workspace backend build

# NOVO: Compile o script de seed para JavaScript puro usando tsc diretamente
# Isso garante que o seed.js seja criado e acessível
RUN npx tsc --project ./apps/backend/tsconfig.json prisma/seed.ts --outDir ./apps/backend/dist/prisma

# Fase 2: Criar a imagem de produção final e enxuta
FROM node:20
WORKDIR /app
ENV NODE_ENV=production

# Copie o package.json e yarn.lock da raiz do monorepo para a imagem final
COPY package.json yarn.lock ./

# Copie o package.json do backend para a imagem final
COPY apps/backend/package.json apps/backend/ ./

# Execute yarn install --production na imagem final para garantir todas as dependências
RUN yarn install --production --frozen-lockfile

# Copie os arquivos compilados do backend (que estão em apps/backend/dist)
COPY --from=builder /app/apps/backend/dist ./dist

# Copie o schema.prisma para a imagem final.
# Necessário para que o NestJS/Prisma possa se conectar ao banco de dados em runtime.
COPY --from=builder /app/apps/backend/prisma/schema.prisma ./prisma/schema.prisma

EXPOSE 3001

# NOVO: Copie o script de seed COMPILADO para a imagem final
COPY --from=builder /app/apps/backend/dist/prisma/seed.js ./dist/prisma/seed.js

# CORREÇÃO FINALÍSSIMA: Injetar DATABASE_URL diretamente no CMD para garantir que o Node a veja
CMD ["sh", "-c", "DATABASE_URL=\"postgresql://aleduque:testpassword123@db:5432/sistema_beleza?schema=public\" node dist/main"]
2.4. apps/frontend/Dockerfile
Define o processo de build para a imagem Docker do frontend.

Caminho: /var/www/sistema-beleza/apps/frontend/Dockerfile

Dockerfile

# apps/frontend/Dockerfile

# Fase 1: Construir a aplicação
FROM node:20-alpine AS builder
WORKDIR /app

# Otimização de cache: copie apenas os manifestos de pacote primeiro
# Copie o package.json e yarn.lock da raiz do monorepo
COPY package.json yarn.lock ./

# Copie os manifests de pacotes específicos do frontend
COPY apps/frontend/package.json apps/frontend/yarn.lock apps/frontend/

# Copie TODO o código-fonte do monorepo para a fase builder
COPY . .

# Instale todas as dependências do monorepo
RUN yarn install

# Definir NEXT_PUBLIC_API_URL explicitamente para o build do Next.js
ENV NEXT_PUBLIC_API_URL=http://192.168.15.4:81/api

# Construa o frontend
RUN yarn workspace frontend build

# Fase 2: Criar a imagem de produção final e enxuta
FROM node:20
WORKDIR /app
ENV NODE_ENV=production

# Copie o package.json e yarn.lock da raiz do monorepo da fase builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

# Copie a pasta node_modules COMPLETA do monorepo da fase builder
# para a raiz da imagem final. Isso é essencial para que 'next start'
# e seus módulos internos funcionem no contexto do monorepo.
COPY --from=builder /app/node_modules ./node_modules

# Copie os arquivos compilados do frontend
# Para next start, ele espera tudo em apps/frontend/.next, public, etc.
COPY --from=builder /app/apps/frontend/.next/standalone/ ./apps/frontend/.next/standalone/
COPY --from=builder /app/apps/frontend/public/ ./apps/frontend/public/
COPY --from=builder /app/apps/frontend/.next/static/ ./apps/frontend/.next/static/

EXPOSE 3000

# Comando final para iniciar a aplicação Next.js: use `next start`
# Ele irá automaticamente procurar por apps/frontend/.next e apps/frontend/public
CMD ["yarn", "workspace", "frontend", "start"]
2.5. apps/backend/package.json
Define scripts e dependências do backend. A seção prisma.seed é importante.

Caminho: /var/www/sistema-beleza/apps/backend/package.json

JSON

{
  "name": "backend",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "typeorm:run-migrations": "ts-node -r tsconfig-paths/register src/shared/infra/typeorm/index.ts",
    "copy:prisma-engine": "ts-node -r tsconfig-paths/register ./copy-prisma-engine.ts",
    "seed:build": "tsc --project ./tsconfig.json prisma/seed.ts --outDir ./dist/prisma",
    "seed:run": "node ./dist/prisma/seed.js"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.2.3",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.2",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.3.1",
    "@prisma/client": "^5.16.1",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "date-fns": "^3.6.0",
    "dotenv": "^16.4.7",
    "nanoid": "^5.1.5",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1",
    "uuid": "^11.1.0",
    "xml2js": "^0.6.2"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@faker-js/faker": "^9.9.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@swc/cli": "^0.6.0",
    "@swc/core": "^1.10.7",
    "@types/bcrypt": "^5.0.2",
    "@types/bcryptjs": "^3.0.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.7",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.2",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^29.7.0",
    "prettier": "^3.4.2",
    "prisma": "^6.11.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "tsconfig-paths-webpack-plugin": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0",
    "webpack-node-externals": "^3.0.0"
  },
  "prisma": {
    "seed": "npm run seed:build && npm run seed:run"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
2.6. apps/backend/prisma/seed.ts
Script que popula o banco de dados com dados iniciais (incluindo o usuário administrador).

Caminho: /var/www/sistema-beleza/apps/backend/prisma/seed.ts

TypeScript

// /var/www/sistema-beleza/apps/backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Certifique-se de que este enum corresponde ao seu schema.prisma
// Exemplo: enum TipoContaContabil { ATIVO, PASSIVO, RECEITA, DESPESA }
enum TipoContaContabilPrisma {
  ATIVO = 'ATIVO',
  PASSIVO = 'PASSIVO',
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA',
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seed: Iniciando seed do banco de dados...');

  // --- 1. Criação/Verificação do Usuário Padrão ---
  const defaultEmail = 'admin@sistema.com';
  const defaultPassword = 'SenhaSegura123'; // Use uma senha forte e segura

  // Hash da senha (importante para segurança)
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: defaultEmail }, // Tenta encontrar o usuário pelo email
    update: {
      password: hashedPassword, // Se o usuário existir, atualiza a senha (útil para re-rodar seeds)
    },
    create: {
      email: defaultEmail,
      name: 'Administrador',
      password: hashedPassword,
    },
  });

  console.log(`Seed: Usuário criado/atualizado: ${user.email}`);
  const userId = user.id;

  // --- 2. Criação do Plano de Contas Padrão ---
  console.log('Seed: Criando plano de contas padrão...');

  // Função auxiliar para obter o próximo código
  async function getNextCodigo(
    currentUserId: string,
    contaPaiId?: string | null,
    contaPaiCodigo?: string, // Adicionado para evitar busca extra se já tiver o código do pai
  ): Promise<string> {
    const parentCode = contaPaiCodigo || (contaPaiId
      ? (await prisma.contaContabil.findUnique({ where: { id: contaPaiId } }))?.codigo
      : null);

    const siblings = await prisma.contaContabil.findMany({
      where: { userId: currentUserId, contaPaiId: contaPaiId },
      select: { codigo: true },
      orderBy: { codigo: 'asc' }, // Ordena para pegar o maior código
    });

    if (siblings.length === 0) {
      return parentCode ? `${parentCode}.1` : '1';
    } else {
      const lastSegment = siblings.reduce((max, c) => {
        const segment = parseInt(c.codigo.split('.').pop() || '0', 10);
        return Math.max(max, segment);
      }, 0);
      return parentCode ? `${parentCode}.${lastSegment + 1}` : `${lastSegment + 1}`;
    }
  }

  const contasContabeisData = [
    {
      nome: 'ATIVO',
      tipo: TipoContaContabilPrisma.ATIVO,
      aceitaLancamento: false,
      contaPaiNome: null, // Não tem pai
    },
    {
      nome: 'ATIVO CIRCULANTE',
      tipo: TipoContaContabilPrisma.ATIVO,
      aceitaLancamento: false,
      contaPaiNome: 'ATIVO',
    },
    {
      nome: 'CAIXA E EQUIVALENTES',
      tipo: TipoContaContabilPrisma.ATIVO,
      aceitaLancamento: false,
      contaPaiNome: 'ATIVO CIRCULANTE',
    },
    {
      nome: 'CAIXA GERAL',
      tipo: TipoContaContabilPrisma.ATIVO,
      aceitaLancamento: true,
      contaPaiNome: 'CAIXA E EQUIVALENTES',
    },
    {
      nome: 'PASSIVO',
      tipo: TipoContaContabilPrisma.PASSIVO,
      aceitaLancamento: false,
      contaPaiNome: null,
    },
    {
      nome: 'PASSIVO CIRCULANTE',
      tipo: TipoContaContabilPrisma.PASSIVO,
      aceitaLancamento: false,
      contaPaiNome: 'PASSIVO',
    },
    {
      nome: 'FORNECEDORES',
      tipo: TipoContaContabilPrisma.PASSIVO,
      aceitaLancamento: true,
      contaPaiNome: 'PASSIVO CIRCULANTE',
    },
    {
      nome: 'RECEITAS',
      tipo: TipoContaContabilPrisma.RECEITA,
      aceitaLancamento: false,
      contaPaiNome: null,
    },
    {
      nome: 'RECEITA DE VENDAS',
      tipo: TipoContaContabilPrisma.RECEITA,
      aceitaLancamento: true,
      contaPaiNome: 'RECEITAS',
    },
    {
      nome: 'DESPESAS',
      tipo: TipoContaContabilPrisma.DESPESA,
      aceitaLancamento: false,
      contaPaiNome: null,
    },
    {
      nome: 'DESPESAS COM VENDAS',
      tipo: TipoContaContabilPrisma.DESPESA,
      aceitaLancamento: true,
      contaPaiNome: 'DESPESAS',
    },
  ];

  const createdContasMap = new Map<string, { id: string; codigo: string }>();

  for (const conta of contasContabeisData) {
    const parentConta = conta.contaPaiNome ? createdContasMap.get(conta.contaPaiNome) : null;
    const contaPaiId = parentConta?.id;
    const contaPaiCodigo = parentConta?.codigo;

    const codigo = await getNextCodigo(userId, contaPaiId, contaPaiCodigo);

    const createdConta = await prisma.contaContabil.upsert({
      where: {
        userId_codigo: { userId, codigo }, // Use unique compound key se tiver
      },
      update: {
        nome: conta.nome,
        tipo: conta.tipo,
        aceitaLancamento: conta.aceitaLancamento,
        contaPaiId: contaPaiId,
      },
      create: {
        userId: userId,
        nome: conta.nome,
        codigo: codigo,
        tipo: conta.tipo,
        aceitaLancamento: conta.aceitaLancamento,
        contaPaiId: contaPaiId,
      },
    });
    createdContasMap.set(conta.nome, { id: createdConta.id, codigo: createdConta.codigo });
  }

  // --- 3. Configurações Padrão para o Usuário ---
  console.log('Seed: Criando configurações padrão para o usuário...');
  const defaultReceitaConta = createdContasMap.get('RECEITA DE VENDAS');
  const defaultCaixaConta = createdContasMap.get('CAIXA GERAL');

  if (defaultReceitaConta && defaultCaixaConta) {
    await prisma.userSettings.upsert({
      where: { userId: userId },
      update: {
        defaultReceitaContaId: defaultReceitaConta.id,
        defaultCaixaContaId: defaultCaixaConta.id, // Supondo que você tem este campo
      },
      create: {
        userId: userId,
        defaultReceitaContaId: defaultReceitaConta.id,
        defaultCaixaContaId: defaultCaixaConta.id, // Supondo que você tem este campo
      },
    });
    console.log('Seed: Configurações de usuário criadas/atualizadas.');
  } else {
    console.warn('Seed: Contas contábeis padrão não encontradas para configurar as user settings. Verifique os nomes.');
  }

  console.log('Seed: Seed do banco de dados concluído.');
}

// Executa a função principal do seed
main()
  .catch((e) => {
    console.error('Seed: Erro ao rodar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });