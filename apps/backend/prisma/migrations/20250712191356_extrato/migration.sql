/*
  Warnings:

  - You are about to drop the column `categoryId` on the `credit_card_transactions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "credit_card_transactions" DROP CONSTRAINT "credit_card_transactions_categoryId_fkey";

-- AlterTable
ALTER TABLE "accounts_pay" ALTER COLUMN "dueDate" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "credit_card_transactions" DROP COLUMN "categoryId",
ADD COLUMN     "contaContabilId" TEXT,
ADD COLUMN     "transactionCategoryId" TEXT;

-- AddForeignKey
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_transactions" ADD CONSTRAINT "credit_card_transactions_transactionCategoryId_fkey" FOREIGN KEY ("transactionCategoryId") REFERENCES "transaction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
