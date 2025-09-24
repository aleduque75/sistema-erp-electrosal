/*
  Warnings:

  - You are about to drop the column `paymentType` on the `quotations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalId]` on the table `AccountRec` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,metal,quotation_date,tipoPagamento]` on the table `quotations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."quotations_organizationId_metal_quotation_date_paymentType_key";

-- AlterTable
ALTER TABLE "public"."AccountRec" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "public"."quotations" DROP COLUMN "paymentType",
ADD COLUMN     "tipoPagamento" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountRec_externalId_key" ON "public"."AccountRec"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_organizationId_metal_quotation_date_tipoPagament_key" ON "public"."quotations"("organizationId", "metal", "quotation_date", "tipoPagamento");
