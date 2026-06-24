-- CreateTable
CREATE TABLE "backup_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileName" TEXT,
    "sizeBytes" INTEGER,
    "message" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);
