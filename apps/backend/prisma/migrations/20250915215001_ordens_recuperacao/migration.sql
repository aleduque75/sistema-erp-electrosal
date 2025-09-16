/*
  Warnings:

  - The `status` column on the `recovery_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."RecoveryOrderStatusPrisma" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "public"."recovery_orders" DROP COLUMN "status",
ADD COLUMN     "status" "public"."RecoveryOrderStatusPrisma" NOT NULL DEFAULT 'PENDENTE';
