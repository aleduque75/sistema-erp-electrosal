-- CreateTable
CREATE TABLE "public"."recovery_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "chemicalAnalysisIds" TEXT[],
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

    CONSTRAINT "recovery_orders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."recovery_orders" ADD CONSTRAINT "recovery_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
