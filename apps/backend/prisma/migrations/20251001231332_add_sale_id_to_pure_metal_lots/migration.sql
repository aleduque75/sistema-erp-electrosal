-- AlterTable
ALTER TABLE "public"."pure_metal_lots" ADD COLUMN     "saleId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."pure_metal_lots" ADD CONSTRAINT "pure_metal_lots_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
