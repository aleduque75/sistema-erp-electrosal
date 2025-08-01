/*
  Warnings:

  - A unique constraint covering the columns `[contaCorrenteId,fitId]` on the table `transacoes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `installmentNumber` to the `sale_installments` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `sale_installments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."SaleInstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- AlterTable
ALTER TABLE "public"."sale_installments" ADD COLUMN     "installmentNumber" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."SaleInstallmentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."transacoes" ADD COLUMN     "fitId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_contaCorrenteId_fitId_key" ON "public"."transacoes"("contaCorrenteId", "fitId");
