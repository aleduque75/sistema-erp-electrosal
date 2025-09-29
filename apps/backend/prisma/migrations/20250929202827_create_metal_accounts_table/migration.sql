/*
  Warnings:

  - You are about to drop the column `contaMetalId` on the `metal_account_entries` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `metal_account_entries` table. All the data in the column will be lost.
  - You are about to drop the column `relatedTransactionId` on the `metal_account_entries` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `metal_account_entries` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `metal_account_entries` table. All the data in the column will be lost.
  - You are about to drop the `ContaMetal` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `date` to the `metal_account_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grams` to the `metal_account_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metalAccountId` to the `metal_account_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `metal_account_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `metal_account_entries` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `metal_account_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."ContaMetal" DROP CONSTRAINT "ContaMetal_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."metal_account_entries" DROP CONSTRAINT "metal_account_entries_contaMetalId_fkey";

-- AlterTable
ALTER TABLE "public"."analises_quimicas" ALTER COLUMN "clienteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."metal_account_entries" DROP COLUMN "contaMetalId",
DROP COLUMN "data",
DROP COLUMN "relatedTransactionId",
DROP COLUMN "tipo",
DROP COLUMN "valor",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "grams" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "metalAccountId" TEXT NOT NULL,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- DropTable
DROP TABLE "public"."ContaMetal";

-- CreateTable
CREATE TABLE "public"."metal_accounts" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" "public"."TipoMetal" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metal_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metal_accounts_organizationId_idx" ON "public"."metal_accounts"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "metal_accounts_organizationId_personId_type_key" ON "public"."metal_accounts"("organizationId", "personId", "type");

-- AddForeignKey
ALTER TABLE "public"."metal_accounts" ADD CONSTRAINT "metal_accounts_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."pessoas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metal_accounts" ADD CONSTRAINT "metal_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metal_account_entries" ADD CONSTRAINT "metal_account_entries_metalAccountId_fkey" FOREIGN KEY ("metalAccountId") REFERENCES "public"."metal_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
