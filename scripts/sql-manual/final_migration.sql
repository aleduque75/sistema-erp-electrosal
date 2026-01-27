-- CreateEnum
CREATE TYPE "public"."ContaMetalType" AS ENUM ('CLIENTE', 'FORNECEDOR', 'INTERNA', 'EMPRESTIMO');

-- DropIndex
DROP INDEX "public"."ContaMetal_organizationId_name_metalType_key";

-- AlterTable
ALTER TABLE "public"."ContaMetal" DROP COLUMN "balance";
ALTER TABLE "public"."ContaMetal" ADD COLUMN     "type" "public"."ContaMetalType";
UPDATE "public"."ContaMetal" SET "type" = 'INTERNA' WHERE "type" IS NULL;
ALTER TABLE "public"."ContaMetal" ALTER COLUMN "type" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."metal_account_entries" (
    "id" TEXT NOT NULL,
    "contaMetalId" TEXT NOT NULL,
    "tipo" "public"."TipoTransacaoPrisma" NOT NULL,
    "valor" DECIMAL(10,4) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedTransactionId" TEXT,
    "description" TEXT,

    CONSTRAINT "metal_account_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContaMetal_organizationId_name_metalType_type_key" ON "public"."ContaMetal"("organizationId", "name", "metalType", "type");

-- AddForeignKey
ALTER TABLE "public"."metal_account_entries" ADD CONSTRAINT "metal_account_entries_contaMetalId_fkey" FOREIGN KEY ("contaMetalId") REFERENCES "public"."ContaMetal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

