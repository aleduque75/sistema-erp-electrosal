-- CreateTable
CREATE TABLE "public"."fornecedores" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("pessoaId")
);

-- AddForeignKey
ALTER TABLE "public"."fornecedores" ADD CONSTRAINT "fornecedores_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fornecedores" ADD CONSTRAINT "fornecedores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
