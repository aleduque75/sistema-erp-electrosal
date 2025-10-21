-- AlterEnum
ALTER TYPE "SaleInstallmentStatus" ADD VALUE 'PARTIALLY_PAID';

-- AlterTable
ALTER TABLE "AccountRec" ADD COLUMN     "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0;
