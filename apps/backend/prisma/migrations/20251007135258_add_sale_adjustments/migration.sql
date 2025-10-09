-- CreateTable
CREATE TABLE "sale_adjustments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentReceivedBRL" DECIMAL(12,2) NOT NULL,
    "paymentQuotation" DECIMAL(12,2) NOT NULL,
    "paymentEquivalentGrams" DECIMAL(12,4) NOT NULL,
    "saleExpectedGrams" DECIMAL(12,4) NOT NULL,
    "grossDiscrepancyGrams" DECIMAL(12,4) NOT NULL,
    "costsInBRL" DECIMAL(12,2) NOT NULL,
    "costsInGrams" DECIMAL(12,4) NOT NULL,
    "netDiscrepancyGrams" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sale_adjustments_saleId_key" ON "sale_adjustments"("saleId");

-- AddForeignKey
ALTER TABLE "sale_adjustments" ADD CONSTRAINT "sale_adjustments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_adjustments" ADD CONSTRAINT "sale_adjustments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
