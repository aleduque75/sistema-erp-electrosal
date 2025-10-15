/*
  Warnings:

  - Added the required column `outputProductId` to the `chemical_reactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'SEPARADO';

-- AlterTable
ALTER TABLE "chemical_reactions" ADD COLUMN     "outputProductId" TEXT NOT NULL,
ALTER COLUMN "outputSilverGrams" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "chemical_reactions" ADD CONSTRAINT "chemical_reactions_outputProductId_fkey" FOREIGN KEY ("outputProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
