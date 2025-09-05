-- CreateTable
CREATE TABLE "public"."clients" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("pessoaId")
);

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
