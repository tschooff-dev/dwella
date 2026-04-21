-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploadedById_fkey";

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "backgroundCheckConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "previousLandlordName" TEXT,
ADD COLUMN     "previousLandlordPhone" TEXT,
ADD COLUMN     "ssnLastFour" TEXT;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "uploadedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "method" TEXT;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
