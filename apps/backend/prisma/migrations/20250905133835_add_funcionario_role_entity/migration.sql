-- CreateTable
CREATE TABLE "public"."funcionarios" (
    "pessoaId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("pessoaId")
);

-- AddForeignKey
ALTER TABLE "public"."funcionarios" ADD CONSTRAINT "funcionarios_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funcionarios" ADD CONSTRAINT "funcionarios_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
