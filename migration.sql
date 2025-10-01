-- Add column auUsedGrams to chemical_reactions
ALTER TABLE "chemical_reactions" ADD COLUMN "auUsedGrams" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Create production_batch_counters table
CREATE TABLE "production_batch_counters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "lastBatchNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_batch_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_batch_counters_organizationId_key" ON "production_batch_counters"("organizationId");

-- Add column batchNumber to inventory_lots
ALTER TABLE "inventory_lots" ADD COLUMN "batchNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_batchNumber_key" ON "inventory_lots"("batchNumber");

-- Add column productionBatchId to chemical_reactions
ALTER TABLE "chemical_reactions" ADD COLUMN "productionBatchId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "chemical_reactions_productionBatchId_key" ON "chemical_reactions"("productionBatchId");

-- AddForeignKey
ALTER TABLE "chemical_reactions" ADD CONSTRAINT "chemical_reactions_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;