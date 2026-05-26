-- CreateEnum
CREATE TYPE "erp"."UserSector" AS ENUM ('PCP', 'FINANCEIRO', 'OPERACOES', 'ESTOQUE', 'RELATORIOS', 'ADMINISTRACAO', 'GERAL');

-- AlterTable
ALTER TABLE "erp"."User" ADD COLUMN     "sector" "erp"."UserSector" NOT NULL DEFAULT 'GERAL';

-- AlterTable
ALTER TABLE "erp"."MenuItem" ADD COLUMN     "allowedSectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "allowedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[];
