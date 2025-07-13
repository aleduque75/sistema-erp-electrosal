-- AlterTable
ALTER TABLE "credit_cards" ADD COLUMN     "contaContabilId" TEXT,
ADD COLUMN     "contaContabilPassivoId" TEXT;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_contaContabilPassivoId_fkey" FOREIGN KEY ("contaContabilPassivoId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_contaContabilId_fkey" FOREIGN KEY ("contaContabilId") REFERENCES "contas_contabeis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
