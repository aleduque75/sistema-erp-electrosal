/*
  Warnings:

  - You are about to drop the column `creditCardReceiveDays` on the `user_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "creditCardReceiveDays" INTEGER DEFAULT 30;

-- AlterTable
ALTER TABLE "public"."user_settings" DROP COLUMN "creditCardReceiveDays";
