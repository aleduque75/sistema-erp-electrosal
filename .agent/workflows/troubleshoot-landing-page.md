---
description: Como diagnosticar e corrigir problemas comuns na Landing Page e Gerenciador
---

# Troubleshooting Landing Page & Manager

Este guia descreve os passos para resolver problemas de loop de carregamento, erros de autenticação (401) e falhas de sincronização na Landing Page.

## 1. Loop de Carregamento Infinito
Causas comuns: Falta do endpoint público ou erro 404 no `/api/landing-page/public`.

1. Verifique se o endpoint público responde:
```bash
curl -I https://dev-api.electrosal.com.br/api/landing-page/public
```
2. Se retornar 404, verifique o `LandingPageController` e garanta que o método `findPublic` tenha o decorador `@Public()`.

## 2. Erro 401 Unauthorized (Biblioteca de Mídia)
Causas comuns: Falha de CORS ou falta de cabeçalho de autorização em chamadas para URLs absolutas.

1. Garanta que o `api.ts` (Next.js) use URLs relativas para chamadas de navegador:
```typescript
const api = axios.create({
  baseURL: typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_API_URL,
});
```
2. Verifique se os rewrites no `next.config.mjs` estão apontando para o backend correto.

## 3. Alterações não aparecem no Site Público
Causas comuns: Landing page fixa no ID 'default' ignorando novas versões.

1. No `LandingPageService.ts`, ajuste o `findPublic` para priorizar a LP mais recente:
```typescript
async findPublic() {
  return this.prisma.landingPage.findFirst({
    where: { sections: { some: {} } },
    orderBy: { updatedAt: 'desc' },
    include: { sections: { orderBy: { order: 'asc' } } },
  });
}
```

## 4. Reset de Senha de Administrador
Para evitar problemas de escaping no terminal, use um script Node.js:

1. Crie um arquivo `set-password.cjs`:
```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('SuaSenha123', 10);
  await prisma.user.update({
    where: { email: 'admin@electrosal.com' },
    data: { password: hash }
  });
}
main();
```
2. Execute com `node set-password.cjs`.

## 6. Tela Branca (Client Modules Error)
Causas comuns: Cache corrompido do Next.js após alterações drásticas no monorepo ou falta de memória no build.

1. Identifique o erro no log: `TypeError: Cannot read properties of undefined (reading 'clientModules')`.
2. Solução: Limpeza profunda e rebuild.
// turbo
```bash
rm -rf apps/frontend/.next
pnpm build
pm2 restart erp-frontend-homolog
```
