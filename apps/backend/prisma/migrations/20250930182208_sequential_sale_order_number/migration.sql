/*
  Warnings:

  - Changed the type of `orderNumber` on the `Sale` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Manually edited to use ALTER COLUMN with a cast to avoid data loss.

*/
-- AlterTable
ALTER TABLE "public"."Sale" ALTER COLUMN "orderNumber" TYPE INTEGER USING ("orderNumber"::integer);