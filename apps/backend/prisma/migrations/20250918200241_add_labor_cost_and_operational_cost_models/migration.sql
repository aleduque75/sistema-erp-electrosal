-- CreateTable
CREATE TABLE "public"."labor_cost_table_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "minGrams" DOUBLE PRECISION NOT NULL,
    "maxGrams" DOUBLE PRECISION,
    "goldGramsCharged" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_cost_table_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."operational_costs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "appliesToProductGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "labor_cost_table_entries_organizationId_minGrams_key" ON "public"."labor_cost_table_entries"("organizationId", "minGrams");

-- CreateIndex
CREATE UNIQUE INDEX "operational_costs_organizationId_name_key" ON "public"."operational_costs"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "public"."labor_cost_table_entries" ADD CONSTRAINT "labor_cost_table_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."operational_costs" ADD CONSTRAINT "operational_costs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
