/*
  Warnings:

  - You are about to drop the column `clientId` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `transactionCategoryId` on the `credit_card_transactions` table. All the data in the column will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transaction_categories` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `pessoaId` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PessoaType" AS ENUM ('FISICA', 'JURIDICA');

-- DropForeignKey
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Sale" DROP CONSTRAINT "Sale_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."credit_card_transactions" DROP CONSTRAINT "credit_card_transactions_transactionCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."transaction_categories" DROP CONSTRAINT "transaction_categories_organizationId_fkey";

-- AlterTable
ALTER TABLE "public"."Sale" DROP COLUMN "clientId",
ADD COLUMN     "pessoaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."credit_card_transactions" DROP COLUMN "transactionCategoryId";

-- DropTable
DROP TABLE "public"."Client";

-- DropTable
DROP TABLE "public"."transaction_categories";

-- CreateTable
CREATE TABLE "public"."pessoas" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "public"."PessoaType" NOT NULL,
    "name" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "cnpj" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_email_key" ON "public"."pessoas"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_cpf_key" ON "public"."pessoas"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_cnpj_key" ON "public"."pessoas"("cnpj");

-- AddForeignKey
ALTER TABLE "public"."pessoas" ADD CONSTRAINT "pessoas_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
