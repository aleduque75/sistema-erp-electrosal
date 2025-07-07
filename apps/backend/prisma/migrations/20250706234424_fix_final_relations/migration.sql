-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "feeAmount" DECIMAL(10,2),
ADD COLUMN     "netAmount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
