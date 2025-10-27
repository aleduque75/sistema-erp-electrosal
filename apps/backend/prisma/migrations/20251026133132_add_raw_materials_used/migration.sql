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

-- AddForeignKey
ALTER TABLE "raw_materials_used" ADD CONSTRAINT "raw_materials_used_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials_used" ADD CONSTRAINT "raw_materials_used_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials_used" ADD CONSTRAINT "raw_materials_used_recoveryOrderId_fkey" FOREIGN KEY ("recoveryOrderId") REFERENCES "recovery_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials_used" ADD CONSTRAINT "raw_materials_used_chemicalReactionId_fkey" FOREIGN KEY ("chemicalReactionId") REFERENCES "chemical_reactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
