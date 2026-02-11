-- CreateEnum
CREATE TYPE "ChemicalReactionStatusPrisma" AS ENUM ('STARTED', 'PROCESSING', 'PENDING_PURITY', 'PENDING_PURITY_ADJUSTMENT', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ContaCorrenteType" AS ENUM ('BANCO', 'FORNECEDOR_METAL', 'EMPRESTIMO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "ContaMetalType" AS ENUM ('CLIENTE', 'FORNECEDOR', 'INTERNA', 'EMPRESTIMO');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('RECOVERY_ORDER', 'CHEMICAL_REACTION', 'PURE_METAL_LOT');

-- CreateEnum
CREATE TYPE "MetalCreditStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELED');

-- CreateEnum
CREATE TYPE "PessoaType" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PureMetalLotMovementType" AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PureMetalLotStatus" AS ENUM ('AVAILABLE', 'USED', 'PARTIALLY_USED');

-- CreateEnum
CREATE TYPE "ReactionLeftoverType" AS ENUM ('BASKET', 'DISTILLATE');

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO', 'PAGO_PARCIALMENTE');

-- CreateEnum
CREATE TYPE "RecoveryOrderStatusPrisma" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA', 'AGUARDANDO_RESULTADO', 'AGUARDANDO_TEOR');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SaleAdjustmentCalcMethod" AS ENUM ('QUANTITY_BASED', 'COST_BASED');

-- CreateEnum
CREATE TYPE "SaleInstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDENTE', 'CONFIRMADO', 'A_SEPARAR', 'FINALIZADO', 'CANCELADO', 'SEPARADO', 'PAGO_PARCIALMENTE');

-- CreateEnum
CREATE TYPE "StatusAnaliseQuimicaPrisma" AS ENUM ('RECEBIDO', 'EM_ANALISE', 'ANALISADO_AGUARDANDO_APROVACAO', 'APROVADO_PARA_RECUPERACAO', 'RECUSADO_PELO_CLIENTE', 'EM_RECUPERACAO', 'FINALIZADO_RECUPERADO', 'CANCELADO', 'RESIDUO');

-- CreateEnum
CREATE TYPE "StatusRecuperacaoPrisma" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTRY', 'EXIT', 'SALE', 'PURCHASE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('GRAMS', 'KILOGRAMS', 'LITERS', 'UNITS');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TipoContaContabilPrisma" AS ENUM ('ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TipoMetal" AS ENUM ('AU', 'AG', 'RH');

-- CreateEnum
CREATE TYPE "TipoTransacaoPrisma" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "TransacaoStatus" AS ENUM ('ATIVA', 'AJUSTADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "AccountRec" (
    "id" TEXT NOT NULL,
    "saleId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contaCorrenteId" TEXT,
    "organizationId" TEXT NOT NULL,
    "transacaoId" TEXT,
    "externalId" TEXT,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "goldAmount" DECIMAL(12,4),
    "goldAmountPaid" DECIMAL(12,4) DEFAULT 0,
    "doNotUpdateSaleStatus" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AccountRec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppearanceSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "themeName" TEXT,
    "customTheme" JSONB,
    "sidebarTheme" JSONB,
    "logoImageId" TEXT,
    "logoText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppearanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logoImageId" TEXT,
    "logoText" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,
    "height" INTEGER,
    "width" INTEGER,
    "recoveryOrderId" TEXT,
    "analiseQuimicaId" TEXT,
    "transacaoId" TEXT,
    "chemicalReactionId" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "disabled" BOOLEAN,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "absorbCreditCardFee" BOOLEAN NOT NULL DEFAULT false,
    "creditCardReceiveDays" INTEGER DEFAULT 30,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "costPrice" DECIMAL(10,2),
    "productGroupId" TEXT,
    "goldValue" DOUBLE PRECISION,
    "externalId" TEXT,
    "stockUnit" "StockUnit" NOT NULL DEFAULT 'GRAMS',

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "feeAmount" DECIMAL(10,2),
    "netAmount" DECIMAL(14,2),
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentTermId" TEXT,
    "pessoaId" TEXT NOT NULL,
    "goldPrice" DECIMAL(10,2),
    "goldValue" DECIMAL(10,4),
    "totalCost" DECIMAL(14,2),
    "commissionAmount" DECIMAL(10,2),
    "commissionDetails" JSONB,
    "externalId" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'PENDENTE',
    "shippingCost" DECIMAL(10,2),
    "readyForPayment" BOOLEAN NOT NULL DEFAULT false,
    "observation" TEXT,
    "salespersonId" TEXT,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "costPriceAtSale" DECIMAL(10,2) NOT NULL,
    "externalId" TEXT,
    "laborPercentage" DECIMAL(5,2),

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "landingPageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "inventoryLotId" TEXT,
    "sourceDocument" TEXT,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutorial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pessoaId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultCaixaContaId" TEXT,
    "defaultDespesaContaId" TEXT,
    "defaultReceitaContaId" TEXT,
    "metalCreditPayableAccountId" TEXT,
    "metalStockAccountId" TEXT,
    "productionCostAccountId" TEXT,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XmlImportLog" (
    "id" TEXT NOT NULL,
    "nfeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "XmlImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_pay" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "installmentNumber" INTEGER,
    "isInstallment" BOOLEAN,
    "totalInstallments" INTEGER,
    "contaContabilId" TEXT,
    "organizationId" TEXT NOT NULL,
    "transacaoId" TEXT,
    "purchaseOrderId" TEXT,
    "fornecedorId" TEXT,
    "originalAccountId" TEXT,
    "goldAmount" DECIMAL(12,4),
    "goldPrice" DECIMAL(10,2),
    "recoveryReportPeriod" TEXT,

    CONSTRAINT "accounts_pay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_quimicas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clienteId" TEXT,
    "numeroAnalise" TEXT NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "descricaoMaterial" TEXT NOT NULL,
    "volumeOuPesoEntrada" DOUBLE PRECISION NOT NULL,
    "unidadeEntrada" TEXT NOT NULL,
    "resultadoAnaliseValor" DOUBLE PRECISION,
    "unidadeResultado" TEXT,
    "percentualQuebra" DOUBLE PRECISION,
    "taxaServicoPercentual" DOUBLE PRECISION,
    "teorRecuperavel" DOUBLE PRECISION,
    "auEstimadoBrutoGramas" DOUBLE PRECISION,
    "auEstimadoRecuperavelGramas" DOUBLE PRECISION,
    "taxaServicoEmGramas" DOUBLE PRECISION,
    "auLiquidoParaClienteGramas" DOUBLE PRECISION,
    "status" "StatusAnaliseQuimicaPrisma" NOT NULL DEFAULT 'RECEBIDO',
    "dataAnaliseConcluida" TIMESTAMP(3),
    "dataAprovacaoCliente" TIMESTAMP(3),
    "dataFinalizacaoRecuperacao" TIMESTAMP(3),
    "observacoes" TEXT,
    "ordemDeRecuperacaoId" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "metalType" "TipoMetal" NOT NULL DEFAULT 'AU',
    "isWriteOff" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "analises_quimicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chemical_reaction_lots" (
    "chemicalReactionId" TEXT NOT NULL,
    "pureMetalLotId" TEXT NOT NULL,
    "gramsToUse" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "chemical_reaction_lots_pkey" PRIMARY KEY ("chemicalReactionId","pureMetalLotId")
);

-- CreateTable
CREATE TABLE "chemical_reactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "auUsedGrams" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "outputProductGrams" DOUBLE PRECISION NOT NULL,
    "status" "ChemicalReactionStatusPrisma" NOT NULL DEFAULT 'STARTED',
    "reactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productionBatchId" TEXT,
    "inputBasketLeftoverGrams" DOUBLE PRECISION,
    "inputDistillateLeftoverGrams" DOUBLE PRECISION,
    "inputGoldGrams" DECIMAL(10,3) NOT NULL,
    "inputRawMaterialGrams" DOUBLE PRECISION NOT NULL,
    "outputBasketLeftoverGrams" DOUBLE PRECISION,
    "outputDistillateLeftoverGrams" DOUBLE PRECISION,
    "outputGoldGrams" DECIMAL(10,3) NOT NULL,
    "outputSilverGrams" DECIMAL(10,3),
    "outputProductId" TEXT NOT NULL,
    "metalType" "TipoMetal" NOT NULL DEFAULT 'AU',
    "reactionNumber" TEXT NOT NULL,

    CONSTRAINT "chemical_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("pessoaId")
);

-- CreateTable
CREATE TABLE "contas_contabeis" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoContaContabilPrisma" NOT NULL,
    "aceitaLancamento" BOOLEAN NOT NULL DEFAULT true,
    "contaPaiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "contas_contabeis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_correntes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numeroConta" TEXT NOT NULL,
    "agencia" TEXT,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "limite" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "initialBalanceBRL" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "initialBalanceGold" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "type" "ContaCorrenteType" NOT NULL DEFAULT 'BANCO',
    "contaContabilId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nick" TEXT,

    CONSTRAINT "contas_correntes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_card_bills" (
    "id" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "credit_card_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_card_fees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    "feePercentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_card_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_card_transactions" (
    "id" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isInstallment" BOOLEAN NOT NULL DEFAULT false,
    "installments" INTEGER,
    "currentInstallment" INTEGER,
    "creditCardBillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contaContabilId" TEXT,
    "fingerprint" TEXT,

    CONSTRAINT "credit_card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "closingDay" INTEGER NOT NULL,
    "dueDate" INTEGER NOT NULL,
    "contaContabilPassivoId" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crr_counters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "lastCrrNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crr_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_counters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "lastNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defaultContaContabilId" TEXT,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("pessoaId")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("pessoaId")
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "remainingQuantity" DOUBLE PRECISION NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "notes" TEXT,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labor_cost_table_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "minGrams" DOUBLE PRECISION NOT NULL,
    "maxGrams" DOUBLE PRECISION,
    "goldGramsCharged" DOUBLE PRECISION NOT NULL,
    "commissionPercentage" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_cost_table_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "usdPrice" DECIMAL(10,4) NOT NULL,
    "goldTroyPrice" DECIMAL(10,2) NOT NULL,
    "silverTroyPrice" DECIMAL(10,2) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_account_entries" (
    "id" TEXT NOT NULL,
    "metalAccountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "grams" DECIMAL(10,4) NOT NULL,
    "type" TEXT NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metal_account_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_accounts" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" "TipoMetal" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metal_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_credits" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "chemicalAnalysisId" TEXT,
    "grams" DECIMAL(10,4) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metalType" "TipoMetal" NOT NULL DEFAULT 'AU',
    "settledGrams" DECIMAL(10,4) DEFAULT 0,
    "status" "MetalCreditStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "metal_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_receivable_payments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metalReceivableId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paidAmountBRL" DECIMAL(10,2) NOT NULL,
    "quotationUsed" DECIMAL(10,2) NOT NULL,
    "paidAmountGrams" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metal_receivable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_receivables" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "pessoaId" TEXT NOT NULL,
    "metalType" "TipoMetal" NOT NULL,
    "grams" DECIMAL(10,4) NOT NULL,
    "status" "ReceivableStatus" NOT NULL DEFAULT 'PENDENTE',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "remainingGrams" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "metal_receivables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_costs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "appliesToProductGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_terms" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "installmentsDays" INTEGER[],
    "interestRate" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "PessoaType" NOT NULL,
    "name" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "cnpj" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalId" TEXT,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_groups" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "commissionPercentage" DECIMAL(5,2),
    "isReactionProductGroup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adjustmentCalcMethod" "SaleAdjustmentCalcMethod" NOT NULL DEFAULT 'QUANTITY_BASED',

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_batch_counters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "lastBatchNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_batch_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rawMaterialId" TEXT,
    "unit" TEXT DEFAULT 'GRAMS',

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentTermId" TEXT,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pure_metal_lot_movements" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pureMetalLotId" TEXT NOT NULL,
    "type" "PureMetalLotMovementType" NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pure_metal_lot_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pure_metal_lots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "metalType" "TipoMetal" NOT NULL,
    "initialGrams" DOUBLE PRECISION NOT NULL,
    "remainingGrams" DOUBLE PRECISION NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "status" "PureMetalLotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "saleId" TEXT,
    "lotNumber" TEXT,
    "description" TEXT,

    CONSTRAINT "pure_metal_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metal" "TipoMetal" NOT NULL,
    "quotation_date" DATE NOT NULL,
    "buyPrice" DECIMAL(10,2) NOT NULL,
    "sellPrice" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tipoPagamento" TEXT,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" "StockUnit" NOT NULL DEFAULT 'GRAMS',
    "cost" DECIMAL(10,2) NOT NULL,
    "isForResale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stock" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_materials_used" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rawMaterialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "goldEquivalentCost" DECIMAL(10,4),
    "recoveryOrderId" TEXT,
    "chemicalReactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_materials_used_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "chemicalAnalysisIds" TEXT[],
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "observacoes" TEXT,
    "status" "RecoveryOrderStatusPrisma" NOT NULL DEFAULT 'PENDENTE',
    "auPuroRecuperadoGramas" DOUBLE PRECISION,
    "descricao" TEXT,
    "residueAnalysisId" TEXT,
    "residuoGramas" DOUBLE PRECISION,
    "resultadoProcessamentoGramas" DOUBLE PRECISION,
    "teorFinal" DOUBLE PRECISION,
    "totalBrutoEstimadoGramas" DOUBLE PRECISION NOT NULL,
    "metalType" "TipoMetal" NOT NULL DEFAULT 'AU',
    "orderNumber" TEXT NOT NULL,
    "descricaoProcesso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commissionAmount" DECIMAL(10,2),
    "commissionPercentage" DECIMAL(5,2),
    "salespersonId" TEXT,

    CONSTRAINT "recovery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recuperacoes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "analiseQuimicaId" TEXT NOT NULL,
    "status" "StatusRecuperacaoPrisma" NOT NULL DEFAULT 'PENDENTE',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "descricaoProcesso" TEXT,
    "volumeProcessado" DOUBLE PRECISION,
    "unidadeProcessada" TEXT,
    "resultadoFinal" DOUBLE PRECISION,
    "unidadeResultado" TEXT,
    "observacoes" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recuperacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_adjustments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentReceivedBRL" DECIMAL(14,2) NOT NULL,
    "paymentQuotation" DECIMAL(12,2),
    "paymentEquivalentGrams" DECIMAL(12,4),
    "saleExpectedGrams" DECIMAL(12,4),
    "grossDiscrepancyGrams" DECIMAL(12,4),
    "costsInBRL" DECIMAL(14,2) NOT NULL,
    "costsInGrams" DECIMAL(12,4),
    "netDiscrepancyGrams" DECIMAL(12,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "grossProfitBRL" DECIMAL(14,2),
    "netProfitBRL" DECIMAL(14,2),
    "otherCostsBRL" DECIMAL(14,2),
    "totalCostBRL" DECIMAL(14,2),
    "laborCostBRL" DECIMAL(14,2),
    "laborCostGrams" DECIMAL(12,4),
    "commissionBRL" DECIMAL(14,2),

    CONSTRAINT "sale_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_installments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "status" "SaleInstallmentStatus" NOT NULL,
    "accountRecId" TEXT,

    CONSTRAINT "sale_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_item_lots" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "inventoryLotId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_item_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "observation" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoTransacaoPrisma" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contaContabilId" TEXT NOT NULL,
    "contaCorrenteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fitId" TEXT,
    "organizationId" TEXT NOT NULL,
    "goldAmount" DECIMAL(10,4),
    "status" "TransacaoStatus" NOT NULL DEFAULT 'ATIVA',
    "accountRecId" TEXT,
    "goldPrice" DECIMAL(10,2),
    "linkedTransactionId" TEXT,
    "fornecedorId" TEXT,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_routines" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_routines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountRec_externalId_key" ON "AccountRec"("externalId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AccountRec_transacaoId_key" ON "AccountRec"("transacaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AppearanceSettings_organizationId_key" ON "AppearanceSettings"("organizationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_name_key" ON "LandingPage"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Media_filename_key" ON "Media"("filename" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Media_path_key" ON "Media"("path" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_organizationId_title_parentId_key" ON "MenuItem"("organizationId" ASC, "title" ASC, "parentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_externalId_key" ON "Sale"("externalId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_orderNumber_key" ON "Sale"("orderNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SaleItem_externalId_key" ON "SaleItem"("externalId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Section_landingPageId_order_key" ON "Section"("landingPageId" ASC, "order" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tutorial_slug_key" ON "Tutorial"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_pessoaId_key" ON "User"("pessoaId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "XmlImportLog_nfeKey_key" ON "XmlImportLog"("nfeKey" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_pay_transacaoId_key" ON "accounts_pay"("transacaoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "analises_quimicas_organizationId_numeroAnalise_key" ON "analises_quimicas"("organizationId" ASC, "numeroAnalise" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "chemical_reactions_organizationId_reactionNumber_key" ON "chemical_reactions"("organizationId" ASC, "reactionNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "chemical_reactions_productionBatchId_key" ON "chemical_reactions"("productionBatchId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "chemical_reactions_reactionNumber_key" ON "chemical_reactions"("reactionNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "contas_contabeis_organizationId_codigo_key" ON "contas_contabeis"("organizationId" ASC, "codigo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "contas_correntes_organizationId_nick_key" ON "contas_correntes"("organizationId" ASC, "nick" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "contas_correntes_organizationId_numeroConta_key" ON "contas_correntes"("organizationId" ASC, "numeroConta" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_fees_organizationId_installments_key" ON "credit_card_fees"("organizationId" ASC, "installments" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_transactions_fingerprint_key" ON "credit_card_transactions"("fingerprint" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "crr_counters_organizationId_key" ON "crr_counters"("organizationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "entity_counters_organizationId_entityType_key" ON "entity_counters"("organizationId" ASC, "entityType" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_batchNumber_key" ON "inventory_lots"("batchNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "labor_cost_table_entries_organizationId_minGrams_key" ON "labor_cost_table_entries"("organizationId" ASC, "minGrams" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "market_data_organizationId_date_key" ON "market_data"("organizationId" ASC, "date" ASC);

-- CreateIndex
CREATE INDEX "metal_accounts_organizationId_idx" ON "metal_accounts"("organizationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "metal_accounts_organizationId_personId_type_key" ON "metal_accounts"("organizationId" ASC, "personId" ASC, "type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "metal_credits_chemicalAnalysisId_key" ON "metal_credits"("chemicalAnalysisId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "metal_receivables_saleId_key" ON "metal_receivables"("saleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "operational_costs_organizationId_name_key" ON "operational_costs"("organizationId" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_terms_organizationId_name_key" ON "payment_terms"("organizationId" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_cnpj_key" ON "pessoas"("cnpj" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_cpf_key" ON "pessoas"("cpf" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_email_key" ON "pessoas"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_externalId_key" ON "pessoas"("externalId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_organizationId_name_key" ON "product_groups"("organizationId" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "production_batch_counters_organizationId_key" ON "production_batch_counters"("organizationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNumber_key" ON "purchase_orders"("orderNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "pure_metal_lots_lotNumber_key" ON "pure_metal_lots"("lotNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "quotations_organizationId_metal_quotation_date_tipoPagament_key" ON "quotations"("organizationId" ASC, "metal" ASC, "quotation_date" ASC, "tipoPagamento" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "recovery_orders_orderNumber_key" ON "recovery_orders"("orderNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "recovery_orders_organizationId_orderNumber_key" ON "recovery_orders"("organizationId" ASC, "orderNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "recovery_orders_residueAnalysisId_key" ON "recovery_orders"("residueAnalysisId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sale_adjustments_saleId_key" ON "sale_adjustments"("saleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sale_item_lots_saleItemId_inventoryLotId_key" ON "sale_item_lots"("saleItemId" ASC, "inventoryLotId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_contaCorrenteId_fitId_key" ON "transacoes"("contaCorrenteId" ASC, "fitId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_linkedTransactionId_key" ON "transacoes"("linkedTransactionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_routines_organizationId_name_key" ON "whatsapp_routines"("organizationId" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_routines_organizationId_trigger_key" ON "whatsapp_routines"("organizationId" ASC, "trigger" ASC);

-- AddForeignKey
ALTER TABLE "AccountRec" ADD CONSTRAINT "AccountRec_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "contas_correntes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRec" ADD CONSTRAINT "AccountRec_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRec" ADD CONSTRAINT "AccountRec_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppearanceSettings" ADD CONSTRAINT "AppearanceSettings_logoImageId_fkey" FOREIGN KEY ("logoImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppearanceSettings" ADD CONSTRAINT "AppearanceSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_logoImageId_fkey" FOREIGN KEY ("logoImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_analiseQuimicaId_fkey" FOREIGN KEY ("analiseQuimicaId") REFERENCES "analises_quimicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_chemicalReactionId_fkey" FOREIGN KEY ("chemicalReactionId") REFERENCES "chemical_reactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_recoveryOrderId_fkey" FOREIGN KEY ("recoveryOrderId") REFERENCES "recovery_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XmlImportLog" ADD CONSTRAINT "XmlImportLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_pay" ADD CONSTRAINT "accounts_pay_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_pay" ADD CONSTRAINT "accounts_pay_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("pessoaId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_pay" ADD CONSTRAINT "accounts_pay_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_pay" ADD CONSTRAINT "accounts_pay_originalAccountId_fkey" FOREIGN KEY ("originalAccountId") REFERENCES "accounts_pay"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "accounts_pay" ADD CONSTRAINT "accounts_pay_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_pay" ADD CONSTRAINT "accounts_pay_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_quimicas" ADD CONSTRAINT "analises_quimicas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_quimicas" ADD CONSTRAINT "analises_quimicas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chemical_reaction_lots" ADD CONSTRAINT "chemical_reaction_lots_chemicalReactionId_fkey" FOREIGN KEY ("chemicalReactionId") REFERENCES "chemical_reactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chemical_reaction_lots" ADD CONSTRAINT "chemical_reaction_lots_pureMetalLotId_fkey" FOREIGN KEY ("pureMetalLotId") REFERENCES "pure_metal_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chemical_reactions" ADD CONSTRAINT "chemical_reactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chemical_reactions" ADD CONSTRAINT "chemical_reactions_outputProductId_fkey" FOREIGN KEY ("outputProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chemical_reactions" ADD CONSTRAINT "chemical_reactions_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_contabeis" ADD CONSTRAINT "contas_contabeis_contaPaiId_fkey" FOREIGN KEY ("contaPaiId") REFERENCES "contas_contabeis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contas_contabeis" ADD CONSTRAINT "contas_contabeis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_correntes" ADD CONSTRAINT "contas_correntes_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_correntes" ADD CONSTRAINT "contas_correntes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_bills" ADD CONSTRAINT "credit_card_bills_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "credit_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_bills" ADD CONSTRAINT "credit_card_bills_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_fees" ADD CONSTRAINT "credit_card_fees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_creditCardBillId_fkey" FOREIGN KEY ("creditCardBillId") REFERENCES "credit_card_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "credit_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_contaContabilPassivoId_fkey" FOREIGN KEY ("contaContabilPassivoId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_defaultContaContabilId_fkey" FOREIGN KEY ("defaultContaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labor_cost_table_entries" ADD CONSTRAINT "labor_cost_table_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_data" ADD CONSTRAINT "market_data_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_account_entries" ADD CONSTRAINT "metal_account_entries_metalAccountId_fkey" FOREIGN KEY ("metalAccountId") REFERENCES "metal_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_accounts" ADD CONSTRAINT "metal_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_accounts" ADD CONSTRAINT "metal_accounts_personId_fkey" FOREIGN KEY ("personId") REFERENCES "pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_credits" ADD CONSTRAINT "metal_credits_chemicalAnalysisId_fkey" FOREIGN KEY ("chemicalAnalysisId") REFERENCES "analises_quimicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_credits" ADD CONSTRAINT "metal_credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_credits" ADD CONSTRAINT "metal_credits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_receivable_payments" ADD CONSTRAINT "metal_receivable_payments_metalReceivableId_fkey" FOREIGN KEY ("metalReceivableId") REFERENCES "metal_receivables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_receivable_payments" ADD CONSTRAINT "metal_receivable_payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_receivables" ADD CONSTRAINT "metal_receivables_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_receivables" ADD CONSTRAINT "metal_receivables_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_receivables" ADD CONSTRAINT "metal_receivables_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_costs" ADD CONSTRAINT "operational_costs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_terms" ADD CONSTRAINT "payment_terms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoas" ADD CONSTRAINT "pessoas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_groups" ADD CONSTRAINT "product_groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("pessoaId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pure_metal_lot_movements" ADD CONSTRAINT "pure_metal_lot_movements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pure_metal_lot_movements" ADD CONSTRAINT "pure_metal_lot_movements_pureMetalLotId_fkey" FOREIGN KEY ("pureMetalLotId") REFERENCES "pure_metal_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pure_metal_lots" ADD CONSTRAINT "pure_metal_lots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pure_metal_lots" ADD CONSTRAINT "pure_metal_lots_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials_used" ADD CONSTRAINT "raw_materials_used_chemicalReactionId_fkey" FOREIGN KEY ("chemicalReactionId") REFERENCES "chemical_reactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials_used" ADD CONSTRAINT "raw_materials_used_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials_used" ADD CONSTRAINT "raw_materials_used_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials_used" ADD CONSTRAINT "raw_materials_used_recoveryOrderId_fkey" FOREIGN KEY ("recoveryOrderId") REFERENCES "recovery_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_orders" ADD CONSTRAINT "recovery_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_orders" ADD CONSTRAINT "recovery_orders_residueAnalysisId_fkey" FOREIGN KEY ("residueAnalysisId") REFERENCES "analises_quimicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_orders" ADD CONSTRAINT "recovery_orders_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "pessoas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recuperacoes" ADD CONSTRAINT "recuperacoes_analiseQuimicaId_fkey" FOREIGN KEY ("analiseQuimicaId") REFERENCES "analises_quimicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recuperacoes" ADD CONSTRAINT "recuperacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_adjustments" ADD CONSTRAINT "sale_adjustments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_adjustments" ADD CONSTRAINT "sale_adjustments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_installments" ADD CONSTRAINT "sale_installments_accountRecId_fkey" FOREIGN KEY ("accountRecId") REFERENCES "AccountRec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_installments" ADD CONSTRAINT "sale_installments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_lots" ADD CONSTRAINT "sale_item_lots_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_item_lots" ADD CONSTRAINT "sale_item_lots_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_accountRecId_fkey" FOREIGN KEY ("accountRecId") REFERENCES "AccountRec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "contas_correntes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("pessoaId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_linkedTransactionId_fkey" FOREIGN KEY ("linkedTransactionId") REFERENCES "transacoes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_routines" ADD CONSTRAINT "whatsapp_routines_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

