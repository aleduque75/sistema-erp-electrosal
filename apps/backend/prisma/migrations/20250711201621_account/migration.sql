-- AlterTable
ALTER TABLE "accounts_pay" ADD COLUMN     "installmentNumber" INTEGER,
ADD COLUMN     "isInstallment" BOOLEAN,
ADD COLUMN     "totalInstallments" INTEGER;
