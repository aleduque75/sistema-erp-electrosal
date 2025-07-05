-- CreateTable
CREATE TABLE "XmlImportLog" (
    "id" TEXT NOT NULL,
    "nfeKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XmlImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "XmlImportLog_nfeKey_key" ON "XmlImportLog"("nfeKey");

-- AddForeignKey
ALTER TABLE "XmlImportLog" ADD CONSTRAINT "XmlImportLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
