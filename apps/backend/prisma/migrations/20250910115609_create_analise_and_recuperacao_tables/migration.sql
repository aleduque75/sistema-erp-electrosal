-- CreateEnum
CREATE TYPE "public"."StatusAnaliseQuimicaPrisma" AS ENUM ('RECEBIDO', 'EM_ANALISE', 'ANALISADO_AGUARDANDO_APROVACAO', 'APROVADO_PARA_RECUPERACAO', 'RECUSADO_PELO_CLIENTE', 'EM_RECUPERACAO', 'FINALIZADO_RECUPERADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."StatusRecuperacaoPrisma" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

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

-- CreateIndex
CREATE UNIQUE INDEX "analises_quimicas_numeroAnalise_key" ON "public"."analises_quimicas"("numeroAnalise");

-- AddForeignKey
ALTER TABLE "public"."recuperacoes" ADD CONSTRAINT "recuperacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recuperacoes" ADD CONSTRAINT "recuperacoes_analiseQuimicaId_fkey" FOREIGN KEY ("analiseQuimicaId") REFERENCES "public"."analises_quimicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analises_quimicas" ADD CONSTRAINT "analises_quimicas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analises_quimicas" ADD CONSTRAINT "analises_quimicas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
