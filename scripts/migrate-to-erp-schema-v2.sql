-- =====================================================
-- MIGRAÇÃO PARA SCHEMA ERP - V2
-- Com tratamento de ENUMs e ordem de dependências
-- =====================================================
-- ATENÇÃO: Execute APÓS rodar prisma db push com schema=erp
-- =====================================================

-- =====================================================
-- FASE 1: TABELAS INDEPENDENTES (sem foreign keys)
-- =====================================================

-- Organization (primeira, outras dependem dela)
INSERT INTO erp."Organization" (
  id, name, "absorbCreditCardFee", "creditCardReceiveDays"
)
SELECT
  id, name, "absorbCreditCardFee", "creditCardReceiveDays"
FROM public."Organization"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FASE 2: USUÁRIOS E CONFIGURAÇÕES
-- =====================================================

-- Pessoa (antes de User, Client, Fornecedor, Funcionario)
INSERT INTO erp."Pessoa" (
  id, "organizationId", type, name, "razaoSocial", email, phone,
  cpf, cnpj, "birthDate", gender, cep, logradouro, numero,
  complemento, bairro, cidade, uf, "createdAt", "updatedAt", "externalId"
)
SELECT
  id, "organizationId", type::text::erp."PessoaType", name, "razaoSocial", email, phone,
  cpf, cnpj, "birthDate", gender, cep, logradouro, numero,
  complemento, bairro, cidade, uf, "createdAt", "updatedAt", "externalId"
FROM public."Pessoa"
ON CONFLICT (id) DO NOTHING;

-- User (depende de Organization e Pessoa)
INSERT INTO erp."User" (
  id, email, password, name, "createdAt", "updatedAt",
  "organizationId", "pessoaId", role
)
SELECT
  id, email, password, name, "createdAt", "updatedAt",
  "organizationId", "pessoaId", role::text::erp."Role"
FROM public."User"
ON CONFLICT (id) DO NOTHING;

-- UserSettings (depende de User)
INSERT INTO erp."UserSettings" (
  id, "userId", theme, language,
  "defaultCaixaContaId", "defaultDespesaContaId", "defaultReceitaContaId",
  "metalCreditPayableAccountId", "metalStockAccountId", "productionCostAccountId"
)
SELECT
  id, "userId", theme, language,
  "defaultCaixaContaId", "defaultDespesaContaId", "defaultReceitaContaId",
  "metalCreditPayableAccountId", "metalStockAccountId", "productionCostAccountId"
FROM public."UserSettings"
ON CONFLICT (id) DO NOTHING;

-- Client (depende de Pessoa)
INSERT INTO erp."Client" (
  "pessoaId", "organizationId", "createdAt", "updatedAt"
)
SELECT
  "pessoaId", "organizationId", "createdAt", "updatedAt"
FROM public."Client"
ON CONFLICT ("pessoaId") DO NOTHING;

-- Fornecedor (depende de Pessoa)
INSERT INTO erp."Fornecedor" (
  "pessoaId", "organizationId", "createdAt", "updatedAt", "defaultContaContabilId"
)
SELECT
  "pessoaId", "organizationId", "createdAt", "updatedAt", "defaultContaContabilId"
FROM public."Fornecedor"
ON CONFLICT ("pessoaId") DO NOTHING;

-- Funcionario (depende de Pessoa)
INSERT INTO erp."Funcionario" (
  "pessoaId", "organizationId", "hireDate", position, "createdAt", "updatedAt"
)
SELECT
  "pessoaId", "organizationId", "hireDate", position, "createdAt", "updatedAt"
FROM public."Funcionario"
ON CONFLICT ("pessoaId") DO NOTHING;

-- =====================================================
-- FASE 3: MÍDIA E LANDING PAGE
-- =====================================================

-- Media (independente)
INSERT INTO erp."Media" (
  id, filename, mimetype, size, path, "createdAt", "updatedAt",
  "organizationId", height, width, "recoveryOrderId",
  "analiseQuimicaId", "transacaoId", "chemicalReactionId"
)
SELECT
  id, filename, mimetype, size, path, "createdAt", "updatedAt",
  "organizationId", height, width, "recoveryOrderId",
  "analiseQuimicaId", "transacaoId", "chemicalReactionId"
FROM public."Media"
ON CONFLICT (id) DO NOTHING;

-- LandingPage (depende de Organization e Media)
INSERT INTO erp."LandingPage" (
  id, name, "createdAt", "updatedAt", "logoImageId", "logoText", "organizationId"
)
SELECT
  id, name, "createdAt", "updatedAt", "logoImageId", "logoText", "organizationId"
FROM public."LandingPage"
ON CONFLICT (id) DO NOTHING;

-- Section (depende de LandingPage)
INSERT INTO erp."Section" (
  id, "landingPageId", "order", type, content, "createdAt", "updatedAt"
)
SELECT
  id, "landingPageId", "order", type, content, "createdAt", "updatedAt"
FROM public."Section"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FASE 4: PRODUTOS E ESTOQUE
-- =====================================================

-- ProductGroup (independente)
INSERT INTO erp."ProductGroup" (
  id, name, description, "createdAt", "updatedAt", "organizationId"
)
SELECT
  id, name, description, "createdAt", "updatedAt", "organizationId"
FROM public."ProductGroup"
ON CONFLICT (id) DO NOTHING;

-- Product (depende de ProductGroup e Organization)
INSERT INTO erp."Product" (
  id, name, description, price, stock, "createdAt", "updatedAt",
  "organizationId", "costPrice", "productGroupId", "goldValue",
  "externalId", "stockUnit"
)
SELECT
  id, name, description, price, stock, "createdAt", "updatedAt",
  "organizationId", "costPrice", "productGroupId", "goldValue",
  "externalId", "stockUnit"::text::erp."StockUnit"
FROM public."Product"
ON CONFLICT (id) DO NOTHING;

-- RawMaterial (depende de Organization)
INSERT INTO erp."RawMaterial" (
  id, "organizationId", name, description, "unitPrice", "stockQuantity",
  unit, "createdAt", "updatedAt"
)
SELECT
  id, "organizationId", name, description, "unitPrice", "stockQuantity",
  unit, "createdAt", "updatedAt"
FROM public."RawMaterial"
ON CONFLICT (id) DO NOTHING;

-- InventoryLot (depende de Product)
INSERT INTO erp."InventoryLot" (
  id, "productId", quantity, "unitCost", "totalCost", "createdAt",
  "expirationDate", "organizationId"
)
SELECT
  id, "productId", quantity, "unitCost", "totalCost", "createdAt",
  "expirationDate", "organizationId"
FROM public."InventoryLot"
ON CONFLICT (id) DO NOTHING;

-- StockMovement (depende de Product)
INSERT INTO erp."StockMovement" (
  id, "productId", quantity, type, date, notes, "createdAt",
  "updatedAt", "organizationId"
)
SELECT
  id, "productId", quantity, type::text::erp."StockMovementType", date, notes, "createdAt",
  "updatedAt", "organizationId"
FROM public."StockMovement"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FASE 5: FINANCEIRO
-- =====================================================

-- ContaContabil (independente)
INSERT INTO erp."ContaContabil" (
  id, "organizationId", codigo, nome, tipo, "ehCaixa", "createdAt", "updatedAt"
)
SELECT
  id, "organizationId", codigo, nome, tipo::text::erp."TipoContaContabil", "ehCaixa", "createdAt", "updatedAt"
FROM public."ContaContabil"
ON CONFLICT (id) DO NOTHING;

-- ContaCorrente (depende de Organization)
INSERT INTO erp."ContaCorrente" (
  id, "organizationId", nome, "saldoInicial", "createdAt", "updatedAt"
)
SELECT
  id, "organizationId", nome, "saldoInicial", "createdAt", "updatedAt"
FROM public."ContaCorrente"
ON CONFLICT (id) DO NOTHING;

-- PaymentTerm (independente)
INSERT INTO erp."PaymentTerm" (
  id, name, "daysToPayment", "organizationId", "createdAt", "updatedAt"
)
SELECT
  id, name, "daysToPayment", "organizationId", "createdAt", "updatedAt"
FROM public."PaymentTerm"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FASE 6: VENDAS
-- =====================================================

-- Sale (depende de múltiplas tabelas)
INSERT INTO erp."Sale" (
  id, "clientId", "salespersonId", "saleDate", "totalAmount", status,
  notes, "createdAt", "updatedAt", "organizationId", "receivableDueDate",
  "paymentTermId", "paymentMethod", "discountPercentage", "discountAmount",
  "finalAmount", "externalId", "goldValue", "clientContaCorrenteId"
)
SELECT
  id, "clientId", "salespersonId", "saleDate", "totalAmount", status,
  notes, "createdAt", "updatedAt", "organizationId", "receivableDueDate",
  "paymentTermId", "paymentMethod"::text::erp."PaymentMethod", "discountPercentage", "discountAmount",
  "finalAmount", "externalId", "goldValue", "clientContaCorrenteId"
FROM public."Sale"
ON CONFLICT (id) DO NOTHING;

-- SaleItem (depende de Sale e Product)
INSERT INTO erp."SaleItem" (
  id, "saleId", "productId", quantity, "unitPrice", "totalPrice",
  "createdAt", "updatedAt", "productGroupId", "goldValue"
)
SELECT
  id, "saleId", "productId", quantity, "unitPrice", "totalPrice",
  "createdAt", "updatedAt", "productGroupId", "goldValue"
FROM public."SaleItem"
ON CONFLICT (id) DO NOTHING;

-- SaleItemLot (depende de SaleItem e InventoryLot)
INSERT INTO erp."SaleItemLot" (
  id, "saleItemId", "inventoryLotId", quantity, "createdAt"
)
SELECT
  id, "saleItemId", "inventoryLotId", quantity, "createdAt"
FROM public."SaleItemLot"
ON CONFLICT (id) DO NOTHING;

-- SaleInstallment (depende de Sale)
INSERT INTO erp."SaleInstallment" (
  id, "saleId", "dueDate", amount, status, "paidAt", "createdAt", "updatedAt"
)
SELECT
  id, "saleId", "dueDate", amount, status::text::erp."InstallmentStatus", "paidAt", "createdAt", "updatedAt"
FROM public."SaleInstallment"
ON CONFLICT (id) DO NOTHING;

-- SaleAdjustment (depende de Sale)
INSERT INTO erp."SaleAdjustment" (
  id, "saleId", "adjustmentType", "adjustmentValue", reason,
  "createdAt", "updatedAt", "organizationId", "method", "itemsAffected"
)
SELECT
  id, "saleId", "adjustmentType"::text::erp."AdjustmentType", "adjustmentValue", reason,
  "createdAt", "updatedAt", "organizationId", "method"::text::erp."AdjustmentMethod", "itemsAffected"
FROM public."SaleAdjustment"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FASE 7: CONTAS A PAGAR/RECEBER
-- =====================================================

-- AccountPay (depende de Fornecedor, ContaContabil)
INSERT INTO erp."AccountPay" (
  id, "fornecedorId", description, amount, "dueDate", "paidAt",
  status, "createdAt", "updatedAt", "organizationId", "contaContabilId"
)
SELECT
  id, "fornecedorId", description, amount, "dueDate", "paidAt",
  status, "createdAt", "updatedAt", "organizationId", "contaContabilId"
FROM public."AccountPay"
ON CONFLICT (id) DO NOTHING;

-- AccountRec (depende de Pessoa, ContaContabil)
INSERT INTO erp."AccountRec" (
  id, "clientId", description, amount, "dueDate", "receivedAt",
  status, "createdAt", "updatedAt", "organizationId", "contaContabilId"
)
SELECT
  id, "clientId", description, amount, "dueDate", "receivedAt",
  status, "createdAt", "updatedAt", "organizationId", "contaContabilId"
FROM public."AccountRec"
ON CONFLICT (id) DO NOTHING;

-- Transacao (depende de múltiplas)
INSERT INTO erp."Transacao" (
  id, "organizationId", tipo, valor, data, descricao,
  "contaContabilId", "contaCorrenteId", "createdAt", "updatedAt",
  "fornecedorId"
)
SELECT
  id, "organizationId", tipo::text::erp."TipoTransacao", valor, data, descricao,
  "contaContabilId", "contaCorrenteId", "createdAt", "updatedAt",
  "fornecedorId"
FROM public."Transacao"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FASE 8: CARTÕES DE CRÉDITO
-- =====================================================

-- CreditCard (depende de Organization)
INSERT INTO erp."CreditCard" (
  id, name, "lastFourDigits", "billingDay", "dueDay",
  "createdAt", "updatedAt", "organizationId"
)
SELECT
  id, name, "lastFourDigits", "billingDay", "dueDay",
  "createdAt", "updatedAt", "organizationId"
FROM public."CreditCard"
ON CONFLICT (id) DO NOTHING;

-- CreditCardBill (depende de CreditCard)
INSERT INTO erp."CreditCardBill" (
  id, "creditCardId", "referenceMonth", "referenceYear", "dueDate",
  amount, status, "paidAt", "createdAt", "updatedAt", "organizationId"
)
SELECT
  id, "creditCardId", "referenceMonth", "referenceYear", "dueDate",
  amount, status, "paidAt", "createdAt", "updatedAt", "organizationId"
FROM public."CreditCardBill"
ON CONFLICT (id) DO NOTHING;

-- CreditCardTransaction (depende de CreditCard e CreditCardBill)
INSERT INTO erp."CreditCardTransaction" (
  id, "creditCardId", description, amount, "transactionDate",
  "createdAt", "updatedAt", "creditCardBillId"
)
SELECT
  id, "creditCardId", description, amount, "transactionDate",
  "createdAt", "updatedAt", "creditCardBillId"
FROM public."CreditCardTransaction"
ON CONFLICT (id) DO NOTHING;

-- CreditCardFee (depende de Organization)
INSERT INTO erp."CreditCardFee" (
  id, "organizationId", "feePercentage", "createdAt", "updatedAt"
)
SELECT
  id, "organizationId", "feePercentage", "createdAt", "updatedAt"
FROM public."CreditCardFee"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FASE 9: SISTEMA E CONFIGURAÇÕES
-- =====================================================

-- MenuItem (depende de Organization)
INSERT INTO erp."MenuItem" (
  id, label, href, icon, "parentId", "order", visible,
  "createdAt", "updatedAt", "organizationId"
)
SELECT
  id, label, href, icon, "parentId", "order", visible,
  "createdAt", "updatedAt", "organizationId"
FROM public."MenuItem"
ON CONFLICT (id) DO NOTHING;

-- AppearanceSettings (depende de Organization e Media)
INSERT INTO erp."AppearanceSettings" (
  id, "organizationId", "logoImageId", "primaryColor", "secondaryColor",
  "fontFamily", "createdAt", "updatedAt"
)
SELECT
  id, "organizationId", "logoImageId", "primaryColor", "secondaryColor",
  "fontFamily", "createdAt", "updatedAt"
FROM public."AppearanceSettings"
ON CONFLICT (id) DO NOTHING;

-- Task (depende de Organization e User)
INSERT INTO erp."Task" (
  id, title, description, status, priority, "dueDate",
  "assignedToId", "createdById", "organizationId", "createdAt", "updatedAt"
)
SELECT
  id, title, description, status::text::erp."TaskStatus", priority::text::erp."TaskPriority", "dueDate",
  "assignedToId", "createdById", "organizationId", "createdAt", "updatedAt"
FROM public."Task"
ON CONFLICT (id) DO NOTHING;

-- Tutorial (independente)
INSERT INTO erp."Tutorial" (
  id, title, description, "videoUrl", category, "order", active, "createdAt", "updatedAt"
)
SELECT
  id, title, description, "videoUrl", category, "order", active, "createdAt", "updatedAt"
FROM public."Tutorial"
ON CONFLICT (id) DO NOTHING;

-- ThemePreset (depende de Organization)
INSERT INTO erp."ThemePreset" (
  id, "organizationId", name, "presetData", "isDefault", "createdAt", "updatedAt"
)
SELECT
  id, "organizationId", name, "presetData", "isDefault", "createdAt", "updatedAt"
FROM public."ThemePreset"
ON CONFLICT (id) DO NOTHING;

-- WhatsAppRoutine (depende de Organization)
INSERT INTO erp."WhatsAppRoutine" (
  id, name, "triggerType", "scheduleTime", active, message,
  "createdAt", "updatedAt", "organizationId"
)
SELECT
  id, name, "triggerType", "scheduleTime", active, message,
  "createdAt", "updatedAt", "organizationId"
FROM public."WhatsAppRoutine"
ON CONFLICT (id) DO NOTHING;

-- XmlImportLog (depende de Organization)
INSERT INTO erp."XmlImportLog" (
  id, filename, status, "importedAt", "errorMessage",
  "createdAt", "updatedAt", "organizationId"
)
SELECT
  id, filename, status, "importedAt", "errorMessage",
  "createdAt", "updatedAt", "organizationId"
FROM public."XmlImportLog"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FASE 10: TABELA DE MIGRATIONS
-- =====================================================

INSERT INTO erp."_prisma_migrations" (
  id, checksum, finished_at, migration_name, logs,
  rolled_back_at, started_at, applied_steps_count
)
SELECT
  id, checksum, finished_at, migration_name, logs,
  rolled_back_at, started_at, applied_steps_count
FROM public."_prisma_migrations"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT
  'CONTAGEM DE REGISTROS' as verificacao,
  'public' as schema_origem,
  'erp' as schema_destino;

SELECT 'Organization' as tabela,
  (SELECT COUNT(*) FROM public."Organization") as public_count,
  (SELECT COUNT(*) FROM erp."Organization") as erp_count;

SELECT 'User' as tabela,
  (SELECT COUNT(*) FROM public."User") as public_count,
  (SELECT COUNT(*) FROM erp."User") as erp_count;

SELECT 'LandingPage' as tabela,
  (SELECT COUNT(*) FROM public."LandingPage") as public_count,
  (SELECT COUNT(*) FROM erp."LandingPage") as erp_count;

SELECT 'Section' as tabela,
  (SELECT COUNT(*) FROM public."Section") as public_count,
  (SELECT COUNT(*) FROM erp."Section") as erp_count;

SELECT 'Media' as tabela,
  (SELECT COUNT(*) FROM public."Media") as public_count,
  (SELECT COUNT(*) FROM erp."Media") as erp_count;

SELECT 'Product' as tabela,
  (SELECT COUNT(*) FROM public."Product") as public_count,
  (SELECT COUNT(*) FROM erp."Product") as erp_count;

SELECT 'Sale' as tabela,
  (SELECT COUNT(*) FROM public."Sale") as public_count,
  (SELECT COUNT(*) FROM erp."Sale") as erp_count;

-- ✅ MIGRAÇÃO CONCLUÍDA!
