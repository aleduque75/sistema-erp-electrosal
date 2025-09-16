/*
  Warnings:

  - You are about to drop the column `descricaoProcesso` on the `recovery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `resultadoFinal` on the `recovery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `unidadeProcessada` on the `recovery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `unidadeResultado` on the `recovery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `volumeProcessado` on the `recovery_orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[residueAnalysisId]` on the table `recovery_orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `totalBrutoEstimadoGramas` to the `recovery_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."RecoveryOrderStatusPrisma" ADD VALUE 'AGUARDANDO_RESULTADO';
ALTER TYPE "public"."RecoveryOrderStatusPrisma" ADD VALUE 'AGUARDANDO_TEOR';

-- AlterTable
ALTER TABLE "public"."recovery_orders" DROP COLUMN "descricaoProcesso",
DROP COLUMN "resultadoFinal",
DROP COLUMN "unidadeProcessada",
DROP COLUMN "unidadeResultado",
DROP COLUMN "volumeProcessado",
ADD COLUMN     "auPuroRecuperadoGramas" DOUBLE PRECISION,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "residueAnalysisId" TEXT,
ADD COLUMN     "residuoGramas" DOUBLE PRECISION,
ADD COLUMN     "resultadoProcessamentoGramas" DOUBLE PRECISION,
ADD COLUMN     "teorFinal" DOUBLE PRECISION,
ADD COLUMN     "totalBrutoEstimadoGramas" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "recovery_orders_residueAnalysisId_key" ON "public"."recovery_orders"("residueAnalysisId");

-- AddForeignKey
ALTER TABLE "public"."recovery_orders" ADD CONSTRAINT "recovery_orders_residueAnalysisId_fkey" FOREIGN KEY ("residueAnalysisId") REFERENCES "public"."analises_quimicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
