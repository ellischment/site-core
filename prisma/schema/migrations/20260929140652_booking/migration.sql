-- CreateTable
CREATE TABLE "BookingService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "durationMin" INTEGER NOT NULL,
    "priceText" TEXT NOT NULL DEFAULT '',
    "locationIds" TEXT NOT NULL DEFAULT '[]',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkingHours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "dayOff" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "DayOff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "locationId" TEXT,
    "note" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "nameEnc" TEXT NOT NULL,
    "contactEnc" TEXT NOT NULL,
    "contactMask" TEXT NOT NULL,
    "contactHash" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "comment" TEXT,
    "consentVersion" TEXT NOT NULL,
    "consentAt" DATETIME NOT NULL,
    "ip" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notifyStatus" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextTryAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "BookingService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingService_slug_key" ON "BookingService"("slug");

-- CreateIndex
CREATE INDEX "BookingService_visible_sort_idx" ON "BookingService"("visible", "sort");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_locationId_weekday_key" ON "WorkingHours"("locationId", "weekday");

-- CreateIndex
CREATE INDEX "DayOff_date_idx" ON "DayOff"("date");

-- CreateIndex
CREATE INDEX "Booking_locationId_startsAt_idx" ON "Booking"("locationId", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_ip_createdAt_idx" ON "Booking"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_notifyStatus_nextTryAt_idx" ON "Booking"("notifyStatus", "nextTryAt");
