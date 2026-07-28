-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "entraClientId" TEXT,
ADD COLUMN     "entraClientSecretEnc" TEXT,
ADD COLUMN     "entraEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "entraRedirectUri" TEXT,
ADD COLUMN     "entraTenantId" TEXT,
ADD COLUMN     "settingsPasswordHash" TEXT;
