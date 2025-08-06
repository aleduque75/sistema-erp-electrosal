-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "paymentTermId" TEXT;

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

-- CreateIndex
CREATE UNIQUE INDEX "payment_terms_organizationId_name_key" ON "public"."payment_terms"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "public"."payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_terms" ADD CONSTRAINT "payment_terms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
