-- CreateTable
CREATE TABLE "public"."cotacoes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metal" "public"."TipoMetal" NOT NULL,
    "data" DATE NOT NULL,
    "valorCompra" DECIMAL(10,2) NOT NULL,
    "valorVenda" DECIMAL(10,2) NOT NULL,
    "tipoPagamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cotacoes_organizationId_metal_data_tipoPagamento_key" ON "public"."cotacoes"("organizationId", "metal", "data", "tipoPagamento");

-- AddForeignKey
ALTER TABLE "public"."cotacoes" ADD CONSTRAINT "cotacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
