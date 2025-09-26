-- CreateEnum
CREATE TYPE "public"."ContaCorrenteType" AS ENUM ('BANCO', 'FORNECEDOR_METAL', 'EMPRESTIMO');

-- AlterTable
ALTER TABLE "public"."contas_correntes" ADD COLUMN     "type" "public"."ContaCorrenteType" NOT NULL DEFAULT 'BANCO';
