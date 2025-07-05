/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderNumber` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "orderNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Sale_orderNumber_key" ON "Sale"("orderNumber");
