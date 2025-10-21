-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('GRAMS', 'KILOGRAMS');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stockUnit" "StockUnit" NOT NULL DEFAULT 'GRAMS';
