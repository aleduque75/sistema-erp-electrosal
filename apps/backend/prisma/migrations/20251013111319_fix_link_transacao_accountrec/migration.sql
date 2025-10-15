-- DropForeignKey
ALTER TABLE "public"."AccountRec" DROP CONSTRAINT "AccountRec_transacaoId_fkey";

-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "accountRecId" TEXT;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_accountRecId_fkey" FOREIGN KEY ("accountRecId") REFERENCES "AccountRec"("id") ON DELETE SET NULL ON UPDATE CASCADE;
