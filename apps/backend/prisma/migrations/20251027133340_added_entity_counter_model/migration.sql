-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('RECOVERY_ORDER', 'CHEMICAL_REACTION');

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

-- CreateIndex
CREATE UNIQUE INDEX "entity_counters_organizationId_entityType_key" ON "entity_counters"("organizationId", "entityType");
