/*
  Warnings:

  - You are about to alter the column `grams` on the `metal_account_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - Added the required column `remainingGrams` to the `metal_receivables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ReceivableStatus" ADD VALUE 'PAGO_PARCIALMENTE';

-- AlterTable
ALTER TABLE "metal_account_entries" ALTER COLUMN "grams" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "metal_receivables" ADD COLUMN     "remainingGrams" DECIMAL(10,4) NOT NULL;

-- CreateTable
CREATE TABLE "metal_receivable_payments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metalReceivableId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paidAmountBRL" DECIMAL(10,2) NOT NULL,
    "quotationUsed" DECIMAL(10,2) NOT NULL,
    "paidAmountGrams" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metal_receivable_payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "metal_receivable_payments" ADD CONSTRAINT "metal_receivable_payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_receivable_payments" ADD CONSTRAINT "metal_receivable_payments_metalReceivableId_fkey" FOREIGN KEY ("metalReceivableId") REFERENCES "metal_receivables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
