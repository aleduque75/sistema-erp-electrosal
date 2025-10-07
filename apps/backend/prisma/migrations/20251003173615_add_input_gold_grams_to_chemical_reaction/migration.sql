/*
  Warnings:

  - Added the required column `inputGoldGrams` to the `chemical_reactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputRawMaterialGrams` to the `chemical_reactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outputGoldGrams` to the `chemical_reactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outputSilverGrams` to the `chemical_reactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chemical_reactions" ADD COLUMN     "inputBasketLeftoverGrams" DOUBLE PRECISION,
ADD COLUMN     "inputDistillateLeftoverGrams" DOUBLE PRECISION,
ADD COLUMN     "inputGoldGrams" DECIMAL(10,3) NOT NULL,
ADD COLUMN     "inputRawMaterialGrams" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "outputBasketLeftoverGrams" DOUBLE PRECISION,
ADD COLUMN     "outputDistillateLeftoverGrams" DOUBLE PRECISION,
ADD COLUMN     "outputGoldGrams" DECIMAL(10,3) NOT NULL,
ADD COLUMN     "outputSilverGrams" DECIMAL(10,3) NOT NULL;
