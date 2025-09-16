-- CreateEnum
CREATE TYPE "public"."TipoMetal" AS ENUM ('AU', 'AG', 'RH');

-- CreateTable
CREATE TABLE "public"."ContaMetal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metalType" "public"."TipoMetal" NOT NULL,
    "balance" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaMetal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContaMetal_organizationId_idx" ON "public"."ContaMetal"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ContaMetal_organizationId_name_metalType_key" ON "public"."ContaMetal"("organizationId", "name", "metalType");

-- AddForeignKey
ALTER TABLE "public"."ContaMetal" ADD CONSTRAINT "ContaMetal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
