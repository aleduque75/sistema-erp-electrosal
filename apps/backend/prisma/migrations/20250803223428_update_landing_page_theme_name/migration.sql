/*
  Warnings:

  - You are about to drop the column `customTheme` on the `LandingPage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."LandingPage" DROP COLUMN "customTheme",
ADD COLUMN     "customThemeName" TEXT;
