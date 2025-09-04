/*
  Warnings:

  - A unique constraint covering the columns `[fingerprint]` on the table `credit_card_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."credit_card_transactions" ADD COLUMN     "fingerprint" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_transactions_fingerprint_key" ON "public"."credit_card_transactions"("fingerprint");
