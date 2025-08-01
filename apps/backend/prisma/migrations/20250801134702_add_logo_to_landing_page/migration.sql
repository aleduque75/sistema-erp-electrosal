-- AlterTable
ALTER TABLE "public"."LandingPage" ADD COLUMN     "logoImageId" TEXT,
ADD COLUMN     "logoText" TEXT;

-- AddForeignKey
ALTER TABLE "public"."LandingPage" ADD CONSTRAINT "LandingPage_logoImageId_fkey" FOREIGN KEY ("logoImageId") REFERENCES "public"."Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
