/*
  Warnings:

  - You are about to drop the column `saldo` on the `contas_correntes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."contas_correntes" DROP COLUMN "saldo",
ADD COLUMN     "initialBalanceBRL" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "initialBalanceGold" DECIMAL(10,4) NOT NULL DEFAULT 0;
