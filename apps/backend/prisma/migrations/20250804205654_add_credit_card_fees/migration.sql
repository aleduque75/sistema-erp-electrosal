-- CreateTable
CREATE TABLE "public"."credit_card_fees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    "feePercentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_card_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_fees_organizationId_installments_key" ON "public"."credit_card_fees"("organizationId", "installments");

-- AddForeignKey
ALTER TABLE "public"."credit_card_fees" ADD CONSTRAINT "credit_card_fees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
