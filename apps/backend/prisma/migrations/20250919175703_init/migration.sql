/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `SaleItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `product_groups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "public"."SaleItem" ADD COLUMN     "externalId" TEXT;

-- AlterTable
ALTER TABLE "public"."product_groups" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalId_key" ON "public"."Product"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_externalId_key" ON "public"."Sale"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItem_externalId_key" ON "public"."SaleItem"("externalId");
