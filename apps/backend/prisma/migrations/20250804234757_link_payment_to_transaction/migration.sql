/*
  Warnings:

  - A unique constraint covering the columns `[transacaoId]` on the table `AccountRec` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transacaoId]` on the table `accounts_pay` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."AccountRec" ADD COLUMN     "transacaoId" TEXT;

-- AlterTable
ALTER TABLE "public"."accounts_pay" ADD COLUMN     "transacaoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountRec_transacaoId_key" ON "public"."AccountRec"("transacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_pay_transacaoId_key" ON "public"."accounts_pay"("transacaoId");

-- AddForeignKey
ALTER TABLE "public"."accounts_pay" ADD CONSTRAINT "accounts_pay_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "public"."transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountRec" ADD CONSTRAINT "AccountRec_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "public"."transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
