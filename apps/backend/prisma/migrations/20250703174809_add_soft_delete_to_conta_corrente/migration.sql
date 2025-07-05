-- DropForeignKey
ALTER TABLE "transacoes" DROP CONSTRAINT "transacoes_contaCorrenteId_fkey";

-- AlterTable
ALTER TABLE "contas_correntes" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_contaCorrenteId_fkey" FOREIGN KEY ("contaCorrenteId") REFERENCES "contas_correntes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
