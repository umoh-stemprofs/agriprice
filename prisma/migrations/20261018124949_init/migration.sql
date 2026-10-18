-- CreateEnum
CREATE TYPE "Crop" AS ENUM ('MAIZE', 'CASSAVA', 'YAM', 'RICE_PADDY', 'TOMATO', 'TILAPIA', 'CATFISH', 'EGGS_TRAY', 'PALM_OIL');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KG', 'TRAY', 'LITRE');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('SIMULATED', 'LIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_ticks" (
    "id" TEXT NOT NULL,
    "crop" "Crop" NOT NULL,
    "date" DATE NOT NULL,
    "priceKobo" INTEGER NOT NULL,
    "unit" "Unit" NOT NULL,
    "source" "PriceSource" NOT NULL DEFAULT 'SIMULATED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_ticks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_snapshots" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "weather_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "crop" "Crop" NOT NULL,
    "qtyKg" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_settings" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "crop" "Crop" NOT NULL,
    "storageKoboPerKgPerWeek" INTEGER NOT NULL DEFAULT 0,
    "spoilagePctPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minGainPct" DOUBLE PRECISION NOT NULL DEFAULT 2,

    CONSTRAINT "cost_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "farms_userId_idx" ON "farms"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "price_ticks_crop_date_key" ON "price_ticks"("crop", "date");

-- CreateIndex
CREATE INDEX "weather_snapshots_farmId_fetchedAt_idx" ON "weather_snapshots"("farmId", "fetchedAt");

-- CreateIndex
CREATE INDEX "inventory_items_farmId_idx" ON "inventory_items"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "cost_settings_farmId_crop_key" ON "cost_settings"("farmId", "crop");

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_settings" ADD CONSTRAINT "cost_settings_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Range rules that must hold for every row (docs/00-global.md §2, 01-agriprice.md).
-- App-level checks exist too, but the database enforces them as well.
ALTER TABLE "farms" ADD CONSTRAINT "farms_lat_check" CHECK ("lat" >= -90 AND "lat" <= 90);
ALTER TABLE "farms" ADD CONSTRAINT "farms_lon_check" CHECK ("lon" >= -180 AND "lon" <= 180);
ALTER TABLE "price_ticks" ADD CONSTRAINT "price_ticks_priceKobo_check" CHECK ("priceKobo" > 0);
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_qtyKg_check" CHECK ("qtyKg" > 0);
ALTER TABLE "cost_settings" ADD CONSTRAINT "cost_settings_storage_check" CHECK ("storageKoboPerKgPerWeek" >= 0);
ALTER TABLE "cost_settings" ADD CONSTRAINT "cost_settings_spoilage_check" CHECK ("spoilagePctPerWeek" >= 0 AND "spoilagePctPerWeek" <= 100);
ALTER TABLE "cost_settings" ADD CONSTRAINT "cost_settings_minGain_check" CHECK ("minGainPct" >= 0);
