/*
  Warnings:

  - You are about to drop the column `metal` on the `metal_credits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "analises_quimicas" ADD COLUMN     "metalType" "TipoMetal" NOT NULL DEFAULT 'AU';

-- AlterTable
ALTER TABLE "chemical_reactions" ADD COLUMN     "metalType" "TipoMetal" NOT NULL DEFAULT 'AU';

-- AlterTable
ALTER TABLE "metal_credits" DROP COLUMN "metal",
ADD COLUMN     "metalType" "TipoMetal" NOT NULL DEFAULT 'AU';

-- AlterTable
ALTER TABLE "recovery_orders" ADD COLUMN     "metalType" "TipoMetal" NOT NULL DEFAULT 'AU';
