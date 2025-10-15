-- AlterTable
ALTER TABLE "sale_adjustments" ADD COLUMN     "grossProfitBRL" DECIMAL(12,2),
ADD COLUMN     "netProfitBRL" DECIMAL(12,2),
ADD COLUMN     "otherCostsBRL" DECIMAL(12,2),
ADD COLUMN     "totalCostBRL" DECIMAL(12,2),
ALTER COLUMN "paymentQuotation" DROP NOT NULL,
ALTER COLUMN "paymentEquivalentGrams" DROP NOT NULL,
ALTER COLUMN "saleExpectedGrams" DROP NOT NULL,
ALTER COLUMN "grossDiscrepancyGrams" DROP NOT NULL,
ALTER COLUMN "costsInGrams" DROP NOT NULL,
ALTER COLUMN "netDiscrepancyGrams" DROP NOT NULL;
