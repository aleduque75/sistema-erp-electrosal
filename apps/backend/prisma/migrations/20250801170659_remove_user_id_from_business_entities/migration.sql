/*
  Warnings:

  - You are about to drop the column `userId` on the `AccountRec` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Client` table. All the data in the column will be lost.
  - The `preferences` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `userId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `XmlImportLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `accounts_pay` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `contas_contabeis` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `contas_correntes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `credit_card_bills` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `credit_cards` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `transacoes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `transaction_categories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigo]` on the table `contas_contabeis` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numeroConta]` on the table `contas_correntes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `transaction_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."AccountRec" DROP CONSTRAINT "AccountRec_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."XmlImportLog" DROP CONSTRAINT "XmlImportLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounts_pay" DROP CONSTRAINT "accounts_pay_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."contas_contabeis" DROP CONSTRAINT "contas_contabeis_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."contas_correntes" DROP CONSTRAINT "contas_correntes_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."credit_card_bills" DROP CONSTRAINT "credit_card_bills_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."credit_cards" DROP CONSTRAINT "credit_cards_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."transacoes" DROP CONSTRAINT "transacoes_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."transaction_categories" DROP CONSTRAINT "transaction_categories_userId_fkey";

-- DropIndex
DROP INDEX "public"."contas_contabeis_userId_codigo_key";

-- DropIndex
DROP INDEX "public"."contas_correntes_userId_numeroConta_key";

-- DropIndex
DROP INDEX "public"."transaction_categories_userId_name_key";

-- AlterTable
ALTER TABLE "public"."AccountRec" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."Client" DROP COLUMN "userId",
DROP COLUMN "preferences",
ADD COLUMN     "preferences" JSONB;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."Sale" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."XmlImportLog" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."accounts_pay" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."contas_contabeis" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."contas_correntes" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."credit_card_bills" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."credit_cards" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."transacoes" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "public"."transaction_categories" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "contas_contabeis_codigo_key" ON "public"."contas_contabeis"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "contas_correntes_numeroConta_key" ON "public"."contas_correntes"("numeroConta");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_categories_name_key" ON "public"."transaction_categories"("name");
