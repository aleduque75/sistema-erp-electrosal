-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "stock" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."SaleItem" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."StockMovement" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."inventory_lots" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "remainingQuantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."purchase_order_items" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;
