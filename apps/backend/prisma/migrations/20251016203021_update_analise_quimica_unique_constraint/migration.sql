/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,numeroAnalise]` on the table `analises_quimicas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."analises_quimicas_numeroAnalise_key";

-- CreateIndex
CREATE UNIQUE INDEX "analises_quimicas_organizationId_numeroAnalise_key" ON "analises_quimicas"("organizationId", "numeroAnalise");
