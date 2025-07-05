/*
  Warnings:

  - You are about to drop the column `saleDate` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "saleDate",
ADD COLUMN     "feeAmount" DECIMAL(10,2),
ADD COLUMN     "netAmount" DECIMAL(10,2);
