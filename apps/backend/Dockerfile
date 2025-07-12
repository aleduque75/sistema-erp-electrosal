
FROM node:20-alpine AS builder 
                               

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY dist/ ./dist/
COPY prisma/ ./prisma/
COPY tsconfig.json ./

RUN npx prisma generate


EXPOSE 3001

CMD ["node", "dist/main.js"]