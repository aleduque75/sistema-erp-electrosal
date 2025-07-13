-- AlterTable
ALTER TABLE "accounts_pay" ADD COLUMN     "contaContabilId" TEXT;

-- AddForeignKey
ALTER TABLE "accounts_pay" ADD CONSTRAINT "accounts_pay_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
