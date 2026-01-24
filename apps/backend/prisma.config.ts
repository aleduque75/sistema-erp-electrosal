// apps/backend/prisma.config.ts
import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    // Aqui é onde a mágica da conexão acontece agora
    url: process.env.DATABASE_URL,
  },
})