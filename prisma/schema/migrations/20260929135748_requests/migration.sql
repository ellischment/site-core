-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "subject" TEXT,
    "nameEnc" TEXT NOT NULL,
    "contactEnc" TEXT NOT NULL,
    "contactMask" TEXT NOT NULL,
    "contactHash" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "comment" TEXT,
    "consentVersion" TEXT NOT NULL,
    "consentAt" DATETIME NOT NULL,
    "ip" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notifyStatus" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextTryAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Request_contactHash_kind_createdAt_idx" ON "Request"("contactHash", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "Request_ip_createdAt_idx" ON "Request"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "Request_notifyStatus_nextTryAt_idx" ON "Request"("notifyStatus", "nextTryAt");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");
