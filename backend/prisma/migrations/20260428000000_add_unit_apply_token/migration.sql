-- AlterTable
ALTER TABLE "units" ADD COLUMN "applyToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "units_applyToken_key" ON "units"("applyToken");
