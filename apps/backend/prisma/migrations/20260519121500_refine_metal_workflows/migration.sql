-- AlterTable
ALTER TABLE "erp"."sale_item_lots" ADD COLUMN "isStockDeducted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "erp"."metal_credits" ADD COLUMN "pureMetalLotId" TEXT;

-- AddForeignKey
ALTER TABLE "erp"."metal_credits" ADD CONSTRAINT "metal_credits_pureMetalLotId_fkey" FOREIGN KEY ("pureMetalLotId") REFERENCES "erp"."pure_metal_lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
