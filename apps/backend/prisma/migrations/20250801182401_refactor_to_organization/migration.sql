/*
  Warnings:

  - You are about to drop the column `address` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `contaContabilId` on the `credit_cards` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,codigo]` on the table `contas_contabeis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,numeroConta]` on the table `contas_correntes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,name]` on the table `transaction_categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `AccountRec` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `XmlImportLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `accounts_pay` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `contas_contabeis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `contas_correntes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `credit_card_bills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `credit_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `transacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `transaction_categories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."credit_cards" DROP CONSTRAINT "credit_cards_contaContabilId_fkey";

-- DropIndex
DROP INDEX "public"."contas_contabeis_codigo_key";

-- DropIndex
DROP INDEX "public"."contas_correntes_numeroConta_key";

-- DropIndex
DROP INDEX "public"."transaction_categories_name_key";

-- AlterTable
ALTER TABLE "public"."AccountRec" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Client" DROP COLUMN "address",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."LandingPage" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "public"."Media" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."XmlImportLog" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."accounts_pay" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."contas_contabeis" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."contas_correntes" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."credit_card_bills" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."credit_cards" DROP COLUMN "contaContabilId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."transacoes" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."transaction_categories" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contas_contabeis_organizationId_codigo_key" ON "public"."contas_contabeis"("organizationId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "contas_correntes_organizationId_numeroConta_key" ON "public"."contas_correntes"("organizationId", "numeroConta");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_categories_organizationId_name_key" ON "public"."transaction_categories"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts_pay" ADD CONSTRAINT "accounts_pay_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccountRec" ADD CONSTRAINT "AccountRec_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_contabeis" ADD CONSTRAINT "contas_contabeis_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contas_correntes" ADD CONSTRAINT "contas_correntes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_cards" ADD CONSTRAINT "credit_cards_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_card_bills" ADD CONSTRAINT "credit_card_bills_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaction_categories" ADD CONSTRAINT "transaction_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."XmlImportLog" ADD CONSTRAINT "XmlImportLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LandingPage" ADD CONSTRAINT "LandingPage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
