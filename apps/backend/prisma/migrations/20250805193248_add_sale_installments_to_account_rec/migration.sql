-- AlterTable
ALTER TABLE "public"."sale_installments" ADD COLUMN     "accountRecId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."sale_installments" ADD CONSTRAINT "sale_installments_accountRecId_fkey" FOREIGN KEY ("accountRecId") REFERENCES "public"."AccountRec"("id") ON DELETE SET NULL ON UPDATE CASCADE;
