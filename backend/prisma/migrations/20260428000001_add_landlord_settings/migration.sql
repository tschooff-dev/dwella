-- CreateTable
CREATE TABLE "landlord_settings" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlord_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landlord_settings_landlordId_key" ON "landlord_settings"("landlordId");

-- AddForeignKey
ALTER TABLE "landlord_settings" ADD CONSTRAINT "landlord_settings_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
