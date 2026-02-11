-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'pt-BR',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system';
