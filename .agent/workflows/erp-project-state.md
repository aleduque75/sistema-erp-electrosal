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
6. **Refatoração dos Módulos Sale-Adjustments e Sales-Movement-Import para DDD:**
   - **`sale-adjustments`:** Criação da entidade rica `SaleAdjustmentEntity` com recálculo de discrepâncias em ouro e margem de lucro. Implementação do repositório desacoplado `SaleAdjustmentRepository` e `PrismaSaleAdjustmentRepository`. Implementação completa da lógica de negócio em `AdjustSaleUseCase`. Refatoração dos casos de uso de conciliação bancária (`BackfillReceivablesUseCase`, `BackfillTransactionsUseCase`) e remoção de caminhos absolutos do disco com fallback seguro em `ReconcileLegacySalesUseCase`.
   - **`sales-movement-import`:** Proteção da rota com `@UseGuards(AuthGuard('jwt'))`, injeção dinâmica de tenant autenticado (`organizationId`) eliminando o ID hardcoded. Desacoplamento do parsing de CSV no serviço isolado `SalesMovementParserService`.
   - Suíte de 83 testes unitários passando em verde em 25 suítes (`sale-adjustments`, `sales-movement-import`, `products`, `pessoa`, `sales`).
7. **Refatoração do Módulo Transações para DDD (Domain-Driven Design):**
   - Criação da entidade de domínio `TransacaoEntity` com métodos de estorno, vínculo de contas e transferências.
   - Criação dos Value Objects `TipoTransacaoVO` (`CREDITO`, `DEBITO`) e `TransacaoStatusVO` (`ATIVA`, `AJUSTADA`, `CANCELADA`) com validações estritas.
   - Implementação do contrato abstrato `TransacaoRepository` e da implementação `PrismaTransacaoRepository`.
   - Criação dos Casos de Uso especializados: `CreateTransacaoUseCase`, `CreateTransferUseCase`, `UpdateTransacaoUseCase`, `DeleteTransacaoUseCase`, `ListTransacoesUseCase`, `GetTransacaoUseCase`, `FindUnlinkedTransacoesUseCase`, `LinkAccountUseCase`, `BulkCreateTransacoesUseCase`, `BulkUpdateTransacoesUseCase`.
   - `TransacoesController` atualizado para orquestrar unicamente os novos Casos de Uso.
   - **Exclusão completa de `transacoes.service.ts`:** Todos os módulos dependentes (`recovery-orders`, `metal-credits`, `automations`) foram migrados para injetar diretamente os novos Casos de Uso (`CreateTransacaoUseCase`, `CreateTransferUseCase`).
8. **Refatoração Completa do Módulo Metal-Payments para DDD & Clean Architecture:**
   - Criação dos Value Objects `MetalAmountVO` (validações estritas de peso > 0, precisão decimal de 4 dígitos) e `MetalTypeVO` (tipagem canônica de metais).
   - Criação da entidade rica `MetalPaymentEntity` contendo cálculo de valor BRL com cotação, dedução de estoque e validações de suficiência de lote.
   - Criação do mapeador de domínio `MetalPaymentMapper`.
   - Inversão de dependência através de `MetalPaymentRepository` abstrato e implementação `PrismaMetalPaymentRepository`, eliminando chamadas diretas ao ORM do caso de uso.
   - Caso de uso `PayClientWithMetalUseCase` e `MetalPaymentsController` desacoplados.
   - Exclusão completa de `metal-payments.service.ts`.
   - 15 testes unitários passando no módulo `metal-payments`.
9. **Refatoração Completa do Módulo Recovery-Orders para DDD & Clean Architecture:**
   - Criação dos Value Objects `RecoveryOrderStatusVO` (máquina de estados com regras de transição), `PurityVO` (teor químico estrito de 0 a 1) e `OrderNumberVO`.
   - Criação da entidade agregada rica `RecoveryOrderEntity` (métodos `start`, `updateProcessingResult`, `finalize`, `cancel`, `calculateYield`) e sub-entidade `RawMaterialItemEntity`.
   - Criação do mapeador bidirecional `RecoveryOrderMapper`.
   - Criação da classe abstrata canônica `RecoveryOrderRepository` e implementação `PrismaRecoveryOrderRepository`.
   - Criação dos casos de uso de leitura `ListRecoveryOrdersUseCase` e `GetRecoveryOrderByIdUseCase`.
   - Desacoplamento do `RecoveryOrdersController` eliminando a injeção direta de repositórios nas rotas HTTP.
   - Criação de 26 testes unitários no módulo `recovery-orders`.
   - **Total:** 147 testes unitários passando em 50 suítes no backend (`metal-payments`, `recovery-orders`, `transacoes`, `sale-adjustments`, `sales-movement-import`, `products`, `pessoa`, `sales`).

---

## 5. 🎯 Diretrizes para o Agente em Novas Sessões

Ao iniciar qualquer sessão:
1. Ler este arquivo (`.agent/workflows/erp-project-state.md`) para se situar sobre a arquitetura e estado recente.
2. Verificar o status do git (`git status`, `git log -n 3`) para conferir se há alterações locais pendentes.
3. Não propor mudanças que retrocedam para `ubuntu-latest` x86 ou que usem comandos obsoletos do PM2.
4. Sempre manter este documento atualizado ao concluir tarefas complexas.
