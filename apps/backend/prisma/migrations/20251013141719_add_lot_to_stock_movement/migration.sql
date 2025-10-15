-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "inventoryLotId" TEXT;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
