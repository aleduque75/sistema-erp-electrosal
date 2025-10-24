/*
  Warnings:

  - You are about to alter the column `grams` on the `metal_credits` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.

*/
-- AlterTable
ALTER TABLE "metal_credits" ALTER COLUMN "grams" SET DATA TYPE DECIMAL(10,4);
