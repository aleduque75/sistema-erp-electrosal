-- =====================================================
-- SCRIPT DE MIGRAÇÃO: public → erp
-- =====================================================
-- ATENÇÃO: Este script copia TODAS as tabelas do schema
-- public para o schema erp. Execute com CUIDADO!
--
-- Pré-requisitos:
-- 1. Backup completo do banco
-- 2. Garantir que não há processos escrevendo no banco
-- 3. Parar aplicações (PM2)
--
-- Uso:
-- psql -U admin -d erp_electrosal -f migrate-to-erp-schema.sql
-- =====================================================

-- 1. Criar schema erp se não existir
CREATE SCHEMA IF NOT EXISTS erp;

-- 2. Verificar tabelas que serão copiadas
-- \dt public.*

-- =====================================================
-- TABELAS PRINCIPAIS DO SISTEMA
-- =====================================================

-- Organization
INSERT INTO erp."Organization" SELECT * FROM public."Organization"
ON CONFLICT DO NOTHING;

-- User e UserSettings
INSERT INTO erp."User" SELECT * FROM public."User"
ON CONFLICT DO NOTHING;

INSERT INTO erp."UserSettings" SELECT * FROM public."UserSettings"
ON CONFLICT DO NOTHING;

-- Landing Page
INSERT INTO erp."LandingPage" SELECT * FROM public."LandingPage"
ON CONFLICT DO NOTHING;

INSERT INTO erp."Section" SELECT * FROM public."Section"
ON CONFLICT DO NOTHING;

-- Media
INSERT INTO erp."Media" SELECT * FROM public."Media"
ON CONFLICT DO NOTHING;

-- Pessoas (clientes, fornecedores, funcionários)
INSERT INTO erp."Pessoa" SELECT * FROM public."Pessoa"
ON CONFLICT DO NOTHING;

INSERT INTO erp."Client" SELECT * FROM public."Client"
ON CONFLICT DO NOTHING;

INSERT INTO erp."Fornecedor" SELECT * FROM public."Fornecedor"
ON CONFLICT DO NOTHING;

INSERT INTO erp."Funcionario" SELECT * FROM public."Funcionario"
ON CONFLICT DO NOTHING;

-- Produtos e Estoque
INSERT INTO erp."Product" SELECT * FROM public."Product"
ON CONFLICT DO NOTHING;

INSERT INTO erp."ProductGroup" SELECT * FROM public."ProductGroup"
ON CONFLICT DO NOTHING;

INSERT INTO erp."RawMaterial" SELECT * FROM public."RawMaterial"
ON CONFLICT DO NOTHING;

INSERT INTO erp."InventoryLot" SELECT * FROM public."InventoryLot"
ON CONFLICT DO NOTHING;

INSERT INTO erp."StockMovement" SELECT * FROM public."StockMovement"
ON CONFLICT DO NOTHING;

-- Vendas
INSERT INTO erp."Sale" SELECT * FROM public."Sale"
ON CONFLICT DO NOTHING;

INSERT INTO erp."SaleItem" SELECT * FROM public."SaleItem"
ON CONFLICT DO NOTHING;

INSERT INTO erp."SaleItemLot" SELECT * FROM public."SaleItemLot"
ON CONFLICT DO NOTHING;

INSERT INTO erp."SaleInstallment" SELECT * FROM public."SaleInstallment"
ON CONFLICT DO NOTHING;

INSERT INTO erp."SaleAdjustment" SELECT * FROM public."SaleAdjustment"
ON CONFLICT DO NOTHING;

INSERT INTO erp."PaymentTerm" SELECT * FROM public."PaymentTerm"
ON CONFLICT DO NOTHING;

-- Financeiro
INSERT INTO erp."ContaContabil" SELECT * FROM public."ContaContabil"
ON CONFLICT DO NOTHING;

INSERT INTO erp."ContaCorrente" SELECT * FROM public."ContaCorrente"
ON CONFLICT DO NOTHING;

INSERT INTO erp."Transacao" SELECT * FROM public."Transacao"
ON CONFLICT DO NOTHING;

INSERT INTO erp."AccountPay" SELECT * FROM public."AccountPay"
ON CONFLICT DO NOTHING;

INSERT INTO erp."AccountRec" SELECT * FROM public."AccountRec"
ON CONFLICT DO NOTHING;

-- Cartões de Crédito
INSERT INTO erp."CreditCard" SELECT * FROM public."CreditCard"
ON CONFLICT DO NOTHING;

INSERT INTO erp."CreditCardTransaction" SELECT * FROM public."CreditCardTransaction"
ON CONFLICT DO NOTHING;

INSERT INTO erp."CreditCardBill" SELECT * FROM public."CreditCardBill"
ON CONFLICT DO NOTHING;

INSERT INTO erp."CreditCardFee" SELECT * FROM public."CreditCardFee"
ON CONFLICT DO NOTHING;

-- Metal e Cotações
INSERT INTO erp."MetalAccount" SELECT * FROM public."MetalAccount"
ON CONFLICT DO NOTHING;

INSERT INTO erp."MetalAccountEntry" SELECT * FROM public."MetalAccountEntry"
ON CONFLICT DO NOTHING;

INSERT INTO erp."MetalCredit" SELECT * FROM public."MetalCredit"
ON CONFLICT DO NOTHING;

INSERT INTO erp."MetalReceivable" SELECT * FROM public."MetalReceivable"
ON CONFLICT DO NOTHING;

INSERT INTO erp."MetalReceivablePayment" SELECT * FROM public."MetalReceivablePayment"
ON CONFLICT DO NOTHING;

INSERT INTO erp."MarketData" SELECT * FROM public."MarketData"
ON CONFLICT DO NOTHING;

-- Produção e Recuperação
INSERT INTO erp."RecoveryOrder" SELECT * FROM public."RecoveryOrder"
ON CONFLICT DO NOTHING;

INSERT INTO erp."Recuperacao" SELECT * FROM public."Recuperacao"
ON CONFLICT DO NOTHING;

INSERT INTO erp."AnaliseQuimica" SELECT * FROM public."AnaliseQuimica"
ON CONFLICT DO NOTHING;

INSERT INTO erp."chemical_reactions" SELECT * FROM public."chemical_reactions"
ON CONFLICT DO NOTHING;

INSERT INTO erp."ChemicalReactionLot" SELECT * FROM public."ChemicalReactionLot"
ON CONFLICT DO NOTHING;

INSERT INTO erp."pure_metal_lots" SELECT * FROM public."pure_metal_lots"
ON CONFLICT DO NOTHING;

INSERT INTO erp."PureMetalLotMovement" SELECT * FROM public."PureMetalLotMovement"
ON CONFLICT DO NOTHING;

INSERT INTO erp."RawMaterialUsed" SELECT * FROM public."RawMaterialUsed"
ON CONFLICT DO NOTHING;

-- Compras
INSERT INTO erp."PurchaseOrder" SELECT * FROM public."PurchaseOrder"
ON CONFLICT DO NOTHING;

INSERT INTO erp."PurchaseOrderItem" SELECT * FROM public."PurchaseOrderItem"
ON CONFLICT DO NOTHING;

-- Cotações e Custos
INSERT INTO erp."Quotation" SELECT * FROM public."Quotation"
ON CONFLICT DO NOTHING;

INSERT INTO erp."LaborCostTableEntry" SELECT * FROM public."LaborCostTableEntry"
ON CONFLICT DO NOTHING;

INSERT INTO erp."OperationalCost" SELECT * FROM public."OperationalCost"
ON CONFLICT DO NOTHING;

-- Sistema
INSERT INTO erp."MenuItem" SELECT * FROM public."MenuItem"
ON CONFLICT DO NOTHING;

INSERT INTO erp."AppearanceSettings" SELECT * FROM public."AppearanceSettings"
ON CONFLICT DO NOTHING;

INSERT INTO erp."Task" SELECT * FROM public."Task"
ON CONFLICT DO NOTHING;

INSERT INTO erp."Tutorial" SELECT * FROM public."Tutorial"
ON CONFLICT DO NOTHING;

INSERT INTO erp."ThemePreset" SELECT * FROM public."ThemePreset"
ON CONFLICT DO NOTHING;

INSERT INTO erp."WhatsAppRoutine" SELECT * FROM public."WhatsAppRoutine"
ON CONFLICT DO NOTHING;

INSERT INTO erp."XmlImportLog" SELECT * FROM public."XmlImportLog"
ON CONFLICT DO NOTHING;

-- Contadores
INSERT INTO erp."ProductionBatchCounter" SELECT * FROM public."ProductionBatchCounter"
ON CONFLICT DO NOTHING;

INSERT INTO erp."CrrCounter" SELECT * FROM public."CrrCounter"
ON CONFLICT DO NOTHING;

INSERT INTO erp."EntityCounter" SELECT * FROM public."EntityCounter"
ON CONFLICT DO NOTHING;

-- Tabela de controle de migrations do Prisma
INSERT INTO erp."_prisma_migrations" SELECT * FROM public."_prisma_migrations"
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Contar registros em cada schema
SELECT 'public' as schema,
       (SELECT COUNT(*) FROM public."User") as users,
       (SELECT COUNT(*) FROM public."Organization") as orgs,
       (SELECT COUNT(*) FROM public."LandingPage") as landing_pages,
       (SELECT COUNT(*) FROM public."Media") as media;

SELECT 'erp' as schema,
       (SELECT COUNT(*) FROM erp."User") as users,
       (SELECT COUNT(*) FROM erp."Organization") as orgs,
       (SELECT COUNT(*) FROM erp."LandingPage") as landing_pages,
       (SELECT COUNT(*) FROM erp."Media") as media;

-- =====================================================
-- PRÓXIMOS PASSOS (NÃO AUTOMÁTICO)
-- =====================================================
--
-- 1. Verificar que os dados foram copiados corretamente
-- 2. Atualizar DATABASE_URL no ecosystem.config.js:
--    schema=public → schema=erp
-- 3. Reiniciar aplicações:
--    pm2 reload ecosystem.config.js --env production
-- 4. Testar a aplicação
-- 5. SE TUDO OK, pode apagar schema public (BACKUP ANTES!)
--
-- =====================================================
