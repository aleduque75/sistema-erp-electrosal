/*
  Warnings:

  - You are about to drop the `cotacoes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."cotacoes" DROP CONSTRAINT "cotacoes_organizationId_fkey";

-- DropTable
DROP TABLE "public"."cotacoes";

-- CreateTable
CREATE TABLE "public"."quotations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metal" "public"."TipoMetal" NOT NULL,
    "quotation_date" DATE NOT NULL,
    "buyPrice" DECIMAL(10,2) NOT NULL,
    "sellPrice" DECIMAL(10,2) NOT NULL,
    "paymentType" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotations_organizationId_metal_quotation_date_paymentType_key" ON "public"."quotations"("organizationId", "metal", "quotation_date", "paymentType");

-- AddForeignKey
ALTER TABLE "public"."quotations" ADD CONSTRAINT "quotations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
