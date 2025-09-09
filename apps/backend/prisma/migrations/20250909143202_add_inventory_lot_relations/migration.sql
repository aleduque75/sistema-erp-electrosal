-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "costPrice" DECIMAL(10,2),
ALTER COLUMN "stock" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."SaleItem" ADD COLUMN     "costPriceAtSale" DECIMAL(10,2),
ADD COLUMN     "inventoryLotId" TEXT;

-- CreateTable
CREATE TABLE "public"."inventory_lots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_lots" ADD CONSTRAINT "inventory_lots_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "public"."inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
