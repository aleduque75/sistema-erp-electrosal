---
description: Estado Atual, Arquitetura (Oracle ARM / Dokploy), Histórico de Decisões e Contexto do ERP Electrosal
---

# 🧠 Estado Atual do ERP Electrosal & Base de Contexto Contínuo

> **Objetivo:** Este documento é a fonte única da verdade para a IA e o desenvolvedor. Sempre que uma nova funcionalidade for implementada, um bug corrigido ou a infraestrutura alterada, este arquivo DEVE ser atualizado para que qualquer nova sessão (mesmo após travamentos ou reinicializações) continue exatamente de onde parou sem perda de contexto.

---

## 1. 🌐 Infraestrutura e Hospedagem Ativa

- **Servidor:** VPS Oracle Cloud (Arquitetura ARM64 Ampere A1, 4 OCPU, 24 GB RAM).
- **Gerenciador de Containers:** **Dokploy**.
- **Domínio Principal:** `https://erp.electrosal.com.br`
  - Encaminha para a porta `8090` gerenciada pelo Nginx interno (`docker-compose.prod.yml`).
  - Rotas de Nginx:
    - `/` -> Frontend Next.js (`frontend:3000`)
    - `/api/` -> Backend NestJS (`backend:3001/api/`)
    - `/public-media/` -> Backend Mídia (`backend:3001/api/media/public-media/`)
- **API Dedicada:** `https://api.electrosal.com.br`
- **WhatsApp / Evolution API:** `https://wa.electrosal.com.br` (porta 8080)
- **Automação n8n:** `https://n8n.electrosal.com.br` (porta 5678)

---

## 2. 🚀 Pipeline de CI/CD & Deploy Automatizado

- **Arquivo:** `.github/workflows/deploy.yml`
- **Runner:** `ubuntu-24.04-arm` (Runner nativo ARM64 do GitHub com 4 vCPUs e 16 GB RAM).
- **Plataforma Docker:** `linux/arm64` nativa (SEM emulação QEMU lenta).
- **Registro de Imagens:** GitHub Container Registry (`ghcr.io`):
  - `ghcr.io/aleduque75/sistema-erp-electrosal-backend:latest`
  - `ghcr.io/aleduque75/sistema-erp-electrosal-frontend:latest`
- **Gatilho de Deploy (Webhook Dokploy):**
  - Ao final do build das imagens, dispara o webhook `secrets.DOKPLOY_WEBHOOK_URL`.
  - O Dokploy baixa as novas imagens e reinicia os containers automaticamente.
- **Controle de Concorrência:** `concurrency: cancel-in-progress: true` (evita filas e cancela builds obsoletos em pushes seguidos).

---

## 3. 🛠️ Stack Tecnológica & Comandos Locais

- **Monorepo:** `pnpm` workspace + Turborepo.
- **Frontend:** Next.js 14+ (App Router, TailwindCSS, Radix UI / Shadcn, Lucide Icons, SWR).
  - Dev local: `NEXT_PUBLIC_API_URL=http://localhost:8090 pnpm --filter frontend dev`
- **Backend:** NestJS, Prisma ORM, PostgreSQL (schema `erp`), Puppeteer para PDFs.
  - Dev local: `pnpm --filter backend start:dev`
- **Core Package:** `@sistema-erp-electrosal/core` (tipos e regras compartilhadas).

---

## 4. 📋 Histórico Recente de Evoluções e Correções

### [01/09/2026]
1. **CI/CD & Deploy Rápido para Oracle ARM:**
   - Migrado o runner de `ubuntu-latest` (x86 + QEMU) para `ubuntu-24.04-arm` nativo.
   - Tempo de build reduzido de ~47 minutos para ~3 a 5 minutos.
   - Webhook do Dokploy configurado com payload de branch `main` e evento `push`, tornando o autodeploy 100% automático.
2. **Reversão e Cancelamento de Vendas:**
   - Reversão para `PENDENTE`: Limpa e exclui as parcelas geradas (`SaleInstallments`) e as contas a receber associadas (`AccountRec`) de qualquer status (`A_SEPARAR`, `SEPARADO`, `CONFIRMADO`, `FINALIZADO`).
   - Ação de exclusão permanente (`DELETE`) disponível apenas para vendas `CANCELADO`.
   - Estorno de estoque no `revert-sale.use-case.ts` agora preenche `sourceDocument: "Estorno Venda #..."` e restaura o lote (`inventoryLotId`), não vindo mais em branco no Extrato de Estoque.
3. **Condições de Pagamento:**
   - Adicionada a opção `A Combinar` no modal de edição de vendas (`EditSaleModal.tsx`) e suporte no backend.
4. **Fuso Horário Global (America/Sao_Paulo / UTC-3):**
   - Configurado `America/Sao_Paulo` no host Linux da VPS, no banco PostgreSQL (`timezone='America/Sao_Paulo'`), no `main.ts` do backend (`process.env.TZ`) e em todos os serviços Docker.
5. **Decisão de Arquitetura de Rede / Nginx:**
   - **Mantido o Nginx interno** como Gateway unificador sob `erp.electrosal.com.br` (porta 8090). Vantagens: mesma origem sem CORS para `/api`, paridade exata com o ambiente local e consumo irrisório de recursos (~5MB RAM).
### [02/09/2026]
1. **Refatoração do Módulo Sales para DDD (Domain-Driven Design):**
   - Eliminação completa de `sales.service.ts` em favor de Casos de Uso especializados (`DeleteSaleUseCase`, `UpdateSaleFinancialsUseCase`, `BackfillSaleAdjustmentsUseCase`, `BackfillSaleQuotationsUseCase`, `BackfillSaleCostsUseCase`, `DiagnoseSaleUseCase`).
   - Implementação de `SalesRepository` e `PrismaSaleRepository`.
   - Criação das entidades de domínio `Sale` e `SaleItem` e Value Object `SaleStatusVO` com regras puras e transições válidas.
   - Suíte com 21 testes unitários criados e validados (`pnpm jest src/sales`).
2. **Correção do Fluxo de Cancelamento & Exclusão de Vendas:**
   - Adicionada a rota `@Patch(':id/cancel')` no `SalesController` conectando a ação do frontend ao `CancelSaleUseCase`.
   - `DeleteSaleUseCase` corrigido para excluir os vínculos com lotes (`SaleItemLot`) e ajustes antes dos itens (`SaleItem`), resolvendo a violação de chave estrangeira (`P2003`) e permitindo excluir a venda para reutilização do número do pedido.
3. **Build Determinístico no Dockerfile:**
   - Adicionada cópia explícita de `/app/apps/backend/dist ./dist` no estágio de runner do `apps/backend/Dockerfile`.
4. **Refatoração do Módulo Pessoa para DDD (Domain-Driven Design):**
   - Eliminação completa de `pessoa.service.ts` em favor de Casos de Uso especializados (`CreatePessoaUseCase`, `UpdatePessoaUseCase`, `ListPessoasUseCase`, `GetPessoaUseCase`, `DeletePessoaUseCase`).
   - Implementação de `PessoaRepository` e `PrismaPessoaRepository` com transações atômicas para papéis (`client`, `fornecedor`, `funcionario`) e compatibilidade mantida com `IPessoaRepository`.
   - Criação da entidade rica `PessoaEntity` e do Value Object `PessoaRoleVO`.
   - Suíte com 22 testes unitários passando (`pnpm jest src/pessoa`).
5. **Refatoração do Módulo Products para DDD (Domain-Driven Design):**
   - Eliminação completa de `products.service.ts` em favor de Casos de Uso especializados (`CreateProductUseCase`, `UpdateProductUseCase`, `ListProductsUseCase`, `GetProductUseCase`, `DeleteProductUseCase`, `AnalyzeXmlImportUseCase`, `ConfirmXmlImportUseCase`, `FixReactionGroupUseCase`, `GetAllProductGroupsUseCase`).
   - Implementação de `ProductRepository` e `PrismaProductRepository` trazendo grupos e lotes ativos com saldo remanescente.
   - Criação da entidade rica `ProductEntity` e do Value Object `StockUnitVO`.
   - Organização de DTOs dedicados (`update-product.dto.ts`, `list-products-query.dto.ts`, `index.ts`).
   - Suíte com 24 testes unitários passando em verde (`npx jest src/products`), com total de 68 testes aprovados entre `products`, `pessoa` e `sales`.

---

## 5. 🎯 Diretrizes para o Agente em Novas Sessões

Ao iniciar qualquer sessão:
1. Ler este arquivo (`.agent/workflows/erp-project-state.md`) para se situar sobre a arquitetura e estado recente.
2. Verificar o status do git (`git status`, `git log -n 3`) para conferir se há alterações locais pendentes.
3. Não propor mudanças que retrocedam para `ubuntu-latest` x86 ou que usem comandos obsoletos do PM2.
4. Sempre manter este documento atualizado ao concluir tarefas complexas.
