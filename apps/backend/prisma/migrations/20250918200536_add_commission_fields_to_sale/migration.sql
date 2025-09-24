-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "commissionAmount" DECIMAL(10,2),
ADD COLUMN     "commissionDetails" JSONB;
