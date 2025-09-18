/*
  Warnings:

  - Made the column `costPriceAtSale` on table `SaleItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "goldPrice" DECIMAL(10,2),
ADD COLUMN     "goldValue" DECIMAL(10,4),
ADD COLUMN     "totalCost" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."SaleItem" ALTER COLUMN "costPriceAtSale" SET NOT NULL;
