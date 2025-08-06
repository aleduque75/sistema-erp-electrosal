-- AlterTable
ALTER TABLE "public"."contas_correntes" ADD COLUMN     "limite" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "public"."transacoes" ADD CONSTRAINT "transacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
