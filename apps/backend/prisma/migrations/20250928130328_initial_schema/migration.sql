-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."PessoaType" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "public"."SaleInstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."TipoContaContabilPrisma" AS ENUM ('ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "public"."TipoTransacaoPrisma" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "public"."ContaCorrenteType" AS ENUM ('BANCO', 'FORNECEDOR_METAL', 'EMPRESTIMO');

-- CreateEnum
CREATE TYPE "public"."StatusAnaliseQuimicaPrisma" AS ENUM ('RECEBIDO', 'EM_ANALISE', 'ANALISADO_AGUARDANDO_APROVACAO', 'APROVADO_PARA_RECUPERACAO', 'RECUSADO_PELO_CLIENTE', 'EM_RECUPERACAO', 'FINALIZADO_RECUPERADO', 'CANCELADO', 'RESIDUO');

-- CreateEnum
CREATE TYPE "public"."StatusRecuperacaoPrisma" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."PurchaseOrderStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."RecoveryOrderStatusPrisma" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA', 'AGUARDANDO_RESULTADO', 'AGUARDANDO_TEOR');

-- CreateEnum
CREATE TYPE "public"."TipoMetal" AS ENUM ('AU', 'AG', 'RH');

-- CreateEnum
CREATE TYPE "public"."PureMetalLotStatus" AS ENUM ('AVAILABLE', 'USED', 'PARTIALLY_USED');

-- CreateEnum
CREATE TYPE "public"."ContaMetalType" AS ENUM ('CLIENTE', 'FORNECEDOR', 'INTERNA', 'EMPRESTIMO');

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "absorbCreditCardFee" BOOLEAN NOT NULL DEFAULT false,
    "creditCardReceiveDays" INTEGER DEFAULT 30,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultReceitaContaId" TEXT,
    "defaultCaixaContaId" TEXT,
    "defaultDespesaContaId" TEXT,
    "metalStockAccountId" TEXT,
    "productionCostAccountId" TEXT,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pessoas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "public"."PessoaType" NOT NULL,
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
CREATE TABLE "public"."clients" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("pessoaId")
);

-- CreateTable
CREATE TABLE "public"."fornecedores" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("pessoaId")
);

-- CreateTable
CREATE TABLE "public"."funcionarios" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("pessoaId")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "costPrice" DECIMAL(10,2),
    "productGroupId" TEXT,
    "goldValue" DOUBLE PRECISION,
    "externalId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_groups" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "commissionPercentage" DECIMAL(5,2),
    "isReactionProductGroup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_lots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "feeAmount" DECIMAL(10,2),
    "netAmount" DECIMAL(10,2),
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentTermId" TEXT,
    "pessoaId" TEXT NOT NULL,
    "goldPrice" DECIMAL(10,2),
    "goldValue" DECIMAL(10,4),
    "totalCost" DECIMAL(10,2),
    "commissionAmount" DECIMAL(10,2),
    "commissionDetails" JSONB,
    "externalId" TEXT,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_terms" (
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
CREATE TABLE "public"."SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "costPriceAtSale" DECIMAL(10,2) NOT NULL,
    "inventoryLotId" TEXT,
    "externalId" TEXT,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sale_installments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "status" "public"."SaleInstallmentStatus" NOT NULL,
    "accountRecId" TEXT,

    CONSTRAINT "sale_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts_pay" (
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

    CONSTRAINT "accounts_pay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccountRec" (
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

    CONSTRAINT "AccountRec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contas_contabeis" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "public"."TipoContaContabilPrisma" NOT NULL,
    "aceitaLancamento" BOOLEAN NOT NULL DEFAULT true,
    "contaPaiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "contas_contabeis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contas_correntes" (
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
    "type" "public"."ContaCorrenteType" NOT NULL DEFAULT 'BANCO',

    CONSTRAINT "contas_correntes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transacoes" (
    "id" TEXT NOT NULL,
    "tipo" "public"."TipoTransacaoPrisma" NOT NULL,
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

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_cards" (
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
CREATE TABLE "public"."credit_card_transactions" (
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
CREATE TABLE "public"."credit_card_bills" (
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
CREATE TABLE "public"."XmlImportLog" (
    "id" TEXT NOT NULL,
    "nfeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "XmlImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LandingPage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logoImageId" TEXT,
    "logoText" TEXT,
    "organizationId" TEXT,
    "customThemeName" TEXT,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Section" (
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
CREATE TABLE "public"."Media" (
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

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_card_fees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    "feePercentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_card_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recuperacoes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "analiseQuimicaId" TEXT NOT NULL,
    "status" "public"."StatusRecuperacaoPrisma" NOT NULL DEFAULT 'PENDENTE',
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
CREATE TABLE "public"."analises_quimicas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
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
    "status" "public"."StatusAnaliseQuimicaPrisma" NOT NULL DEFAULT 'RECEBIDO',
    "dataAnaliseConcluida" TIMESTAMP(3),
    "dataAprovacaoCliente" TIMESTAMP(3),
    "dataFinalizacaoRecuperacao" TIMESTAMP(3),
    "observacoes" TEXT,
    "ordemDeRecuperacaoId" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analises_quimicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."metal_credits" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "chemicalAnalysisId" TEXT NOT NULL,
    "metal" TEXT NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metal_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "public"."PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentTermId" TEXT,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recovery_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "chemicalAnalysisIds" TEXT[],
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "observacoes" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "status" "public"."RecoveryOrderStatusPrisma" NOT NULL DEFAULT 'PENDENTE',
    "auPuroRecuperadoGramas" DOUBLE PRECISION,
    "descricao" TEXT,
    "residueAnalysisId" TEXT,
    "residuoGramas" DOUBLE PRECISION,
    "resultadoProcessamentoGramas" DOUBLE PRECISION,
    "teorFinal" DOUBLE PRECISION,
    "totalBrutoEstimadoGramas" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "recovery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContaMetal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metalType" "public"."TipoMetal" NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "type" "public"."ContaMetalType" NOT NULL,

    CONSTRAINT "ContaMetal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."metal_account_entries" (
    "id" TEXT NOT NULL,
    "contaMetalId" TEXT NOT NULL,
    "tipo" "public"."TipoTransacaoPrisma" NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedTransactionId" TEXT,
    "description" TEXT,

    CONSTRAINT "metal_account_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quotations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metal" "public"."TipoMetal" NOT NULL,
    "quotation_date" DATE NOT NULL,
    "buyPrice" DECIMAL(10,2) NOT NULL,
    "sellPrice" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tipoPagamento" TEXT,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."labor_cost_table_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "minGrams" DOUBLE PRECISION NOT NULL,
    "maxGrams" DOUBLE PRECISION,
    "goldGramsCharged" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_cost_table_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."operational_costs" (
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
CREATE TABLE "public"."chemical_reactions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "inputBasketLeftoverGrams" DOUBLE PRECISION,
    "inputDistillateLeftoverGrams" DOUBLE PRECISION,
    "inputGoldGrams" DOUBLE PRECISION NOT NULL,
    "inputRawMaterialGrams" DOUBLE PRECISION NOT NULL,
    "organizationId" TEXT NOT NULL,
    "outputBasketLeftoverGrams" DOUBLE PRECISION,
    "outputDistillateLeftoverGrams" DOUBLE PRECISION,
    "outputProductGrams" DOUBLE PRECISION NOT NULL,
    "reactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chemical_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pure_metal_lots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "metalType" "public"."TipoMetal" NOT NULL,
    "initialGrams" DOUBLE PRECISION NOT NULL,
    "remainingGrams" DOUBLE PRECISION NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "status" "public"."PureMetalLotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pure_metal_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_chemical_reactionsTopure_metal_lots" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_chemical_reactionsTopure_metal_lots_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "public"."user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_email_key" ON "public"."pessoas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_cpf_key" ON "public"."pessoas"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_cnpj_key" ON "public"."pessoas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_externalId_key" ON "public"."pessoas"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalId_key" ON "public"."Product"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_organizationId_name_key" ON "public"."product_groups"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_orderNumber_key" ON "public"."Sale"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_externalId_key" ON "public"."Sale"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_terms_organizationId_name_key" ON "public"."payment_terms"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItem_externalId_key" ON "public"."SaleItem"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_pay_transacaoId_key" ON "public"."accounts_pay"("transacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRec_transacaoId_key" ON "public"."AccountRec"("transacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRec_externalId_key" ON "public"."AccountRec"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "contas_contabeis_organizationId_codigo_key" ON "public"."contas_contabeis"("organizationId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "contas_correntes_organizationId_numeroConta_key" ON "public"."contas_correntes"("organizationId", "numeroConta");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_contaCorrenteId_fitId_key" ON "public"."transacoes"("contaCorrenteId", "fitId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_transactions_fingerprint_key" ON "public"."credit_card_transactions"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "XmlImportLog_nfeKey_key" ON "public"."XmlImportLog"("nfeKey");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_name_key" ON "public"."LandingPage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Section_landingPageId_order_key" ON "public"."Section"("landingPageId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Media_filename_key" ON "public"."Media"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "Media_path_key" ON "public"."Media"("path");

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_fees_organizationId_installments_key" ON "public"."credit_card_fees"("organizationId", "installments");

-- CreateIndex
CREATE UNIQUE INDEX "analises_quimicas_numeroAnalise_key" ON "public"."analises_quimicas"("numeroAnalise");

-- CreateIndex
CREATE UNIQUE INDEX "metal_credits_chemicalAnalysisId_key" ON "public"."metal_credits"("chemicalAnalysisId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNumber_key" ON "public"."purchase_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_orders_residueAnalysisId_key" ON "public"."recovery_orders"("residueAnalysisId");

-- CreateIndex
CREATE INDEX "ContaMetal_organizationId_idx" ON "public"."ContaMetal"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ContaMetal_organizationId_name_metalType_type_key" ON "public"."ContaMetal"("organizationId", "name", "metalType", "type");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_organizationId_metal_quotation_date_tipoPagament_key" ON "public"."quotations"("organizationId", "metal", "quotation_date", "tipoPagamento");

-- CreateIndex
CREATE UNIQUE INDEX "labor_cost_table_entries_organizationId_minGrams_key" ON "public"."labor_cost_table_entries"("organizationId", "minGrams");

-- CreateIndex
CREATE UNIQUE INDEX "operational_costs_organizationId_name_key" ON "public"."operational_costs"("organizationId", "name");

-- CreateIndex
CREATE INDEX "_chemical_reactionsTopure_metal_lots_B_index" ON "public"."_chemical_reactionsTopure_metal_lots"("B");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pessoas" ADD CONSTRAINT "pessoas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fornecedores" ADD CONSTRAINT "fornecedores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fornecedores" ADD CONSTRAINT "fornecedores_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funcionarios" ADD CONSTRAINT "funcionarios_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funcionarios" ADD CONSTRAINT "funcionarios_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "public"."product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_groups" ADD CONSTRAINT "product_groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "public"."payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_terms" ADD CONSTRAINT "payment_terms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "public"."inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale_installments" ADD CONSTRAINT "sale_installments_accountRecId_fkey" FOREIGN KEY ("accountRecId") REFERENCES "public"."AccountRec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale_installments" ADD CONSTRAINT "sale_installments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts_pay" ADD CONSTRAINT "accounts_pay_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "public"."contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts_pay" ADD CONSTRAINT "accounts_pay_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts_pay" ADD CONSTRAINT "accounts_pay_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "public"."transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountRec" ADD CONSTRAINT "AccountRec_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "public"."contas_correntes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountRec" ADD CONSTRAINT "AccountRec_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountRec" ADD CONSTRAINT "AccountRec_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountRec" ADD CONSTRAINT "AccountRec_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "public"."transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_contabeis" ADD CONSTRAINT "contas_contabeis_contaPaiId_fkey" FOREIGN KEY ("contaPaiId") REFERENCES "public"."contas_contabeis"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."contas_contabeis" ADD CONSTRAINT "contas_contabeis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_correntes" ADD CONSTRAINT "contas_correntes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transacoes" ADD CONSTRAINT "transacoes_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "public"."contas_contabeis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transacoes" ADD CONSTRAINT "transacoes_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "public"."contas_correntes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transacoes" ADD CONSTRAINT "transacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_cards" ADD CONSTRAINT "credit_cards_contaContabilPassivoId_fkey" FOREIGN KEY ("contaContabilPassivoId") REFERENCES "public"."contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_cards" ADD CONSTRAINT "credit_cards_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "public"."contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_creditCardBillId_fkey" FOREIGN KEY ("creditCardBillId") REFERENCES "public"."credit_card_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_card_bills" ADD CONSTRAINT "credit_card_bills_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_card_bills" ADD CONSTRAINT "credit_card_bills_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."XmlImportLog" ADD CONSTRAINT "XmlImportLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LandingPage" ADD CONSTRAINT "LandingPage_logoImageId_fkey" FOREIGN KEY ("logoImageId") REFERENCES "public"."Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LandingPage" ADD CONSTRAINT "LandingPage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Section" ADD CONSTRAINT "Section_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "public"."LandingPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_card_fees" ADD CONSTRAINT "credit_card_fees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recuperacoes" ADD CONSTRAINT "recuperacoes_analiseQuimicaId_fkey" FOREIGN KEY ("analiseQuimicaId") REFERENCES "public"."analises_quimicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recuperacoes" ADD CONSTRAINT "recuperacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analises_quimicas" ADD CONSTRAINT "analises_quimicas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analises_quimicas" ADD CONSTRAINT "analises_quimicas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metal_credits" ADD CONSTRAINT "metal_credits_chemicalAnalysisId_fkey" FOREIGN KEY ("chemicalAnalysisId") REFERENCES "public"."analises_quimicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metal_credits" ADD CONSTRAINT "metal_credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metal_credits" ADD CONSTRAINT "metal_credits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedores"("pessoaId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "public"."payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recovery_orders" ADD CONSTRAINT "recovery_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recovery_orders" ADD CONSTRAINT "recovery_orders_residueAnalysisId_fkey" FOREIGN KEY ("residueAnalysisId") REFERENCES "public"."analises_quimicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContaMetal" ADD CONSTRAINT "ContaMetal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metal_account_entries" ADD CONSTRAINT "metal_account_entries_contaMetalId_fkey" FOREIGN KEY ("contaMetalId") REFERENCES "public"."ContaMetal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quotations" ADD CONSTRAINT "quotations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."labor_cost_table_entries" ADD CONSTRAINT "labor_cost_table_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."operational_costs" ADD CONSTRAINT "operational_costs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chemical_reactions" ADD CONSTRAINT "chemical_reactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pure_metal_lots" ADD CONSTRAINT "pure_metal_lots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_chemical_reactionsTopure_metal_lots" ADD CONSTRAINT "_chemical_reactionsTopure_metal_lots_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."chemical_reactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_chemical_reactionsTopure_metal_lots" ADD CONSTRAINT "_chemical_reactionsTopure_metal_lots_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."pure_metal_lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
