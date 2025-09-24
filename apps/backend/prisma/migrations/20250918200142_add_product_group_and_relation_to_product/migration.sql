-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "productGroupId" TEXT;

-- CreateTable
CREATE TABLE "public"."product_groups" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "commissionPercentage" DECIMAL(5,2),
    "isReactionProductGroup" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_organizationId_name_key" ON "public"."product_groups"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "public"."product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_groups" ADD CONSTRAINT "product_groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
