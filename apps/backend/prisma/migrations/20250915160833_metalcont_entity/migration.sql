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

-- CreateIndex
CREATE UNIQUE INDEX "metal_credits_chemicalAnalysisId_key" ON "public"."metal_credits"("chemicalAnalysisId");

-- AddForeignKey
ALTER TABLE "public"."metal_credits" ADD CONSTRAINT "metal_credits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metal_credits" ADD CONSTRAINT "metal_credits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metal_credits" ADD CONSTRAINT "metal_credits_chemicalAnalysisId_fkey" FOREIGN KEY ("chemicalAnalysisId") REFERENCES "public"."analises_quimicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
