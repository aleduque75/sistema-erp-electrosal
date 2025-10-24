-- AlterTable
ALTER TABLE "AccountRec" ADD COLUMN     "goldAmount" DECIMAL(12,4),
ADD COLUMN     "goldAmountPaid" DECIMAL(12,4) DEFAULT 0;
