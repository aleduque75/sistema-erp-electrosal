-- CreateTable
CREATE TABLE "public"."LandingPage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" TEXT NOT NULL,
    "landingPageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_name_key" ON "public"."LandingPage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Section_landingPageId_order_key" ON "public"."Section"("landingPageId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Media_filename_key" ON "public"."Media"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "Media_path_key" ON "public"."Media"("path");

-- AddForeignKey
ALTER TABLE "public"."Section" ADD CONSTRAINT "Section_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "public"."LandingPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
