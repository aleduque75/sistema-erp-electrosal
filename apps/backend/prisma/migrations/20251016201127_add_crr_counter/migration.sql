-- CreateTable
CREATE TABLE "crr_counters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "lastCrrNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crr_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crr_counters_organizationId_key" ON "crr_counters"("organizationId");
