-- CreateEnum
CREATE TYPE "TransacaoStatus" AS ENUM ('ATIVA', 'AJUSTADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "status" "TransacaoStatus" NOT NULL DEFAULT 'ATIVA';
