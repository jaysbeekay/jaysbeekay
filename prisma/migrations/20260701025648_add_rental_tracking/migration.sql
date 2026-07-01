-- CreateTable
CREATE TABLE "rental_statements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "statementDate" DATETIME,
    "grossRent" REAL,
    "managementFee" REAL,
    "otherDeductions" REAL,
    "netAmount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rental_statements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rental_statement_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rentalStatementId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rental_statement_documents_rentalStatementId_fkey" FOREIGN KEY ("rentalStatementId") REFERENCES "rental_statements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "isRented" BOOLEAN NOT NULL DEFAULT false,
    "rentalWeeklyRent" REAL,
    "rentalManagementFeePercent" REAL,
    "rentalTenantName" TEXT,
    "rentalLeaseStart" DATETIME,
    "rentalLeaseEnd" DATETIME,
    "rentalCurrency" TEXT NOT NULL DEFAULT 'AUD',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "properties_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_properties" ("address", "createdAt", "createdById", "id", "label", "notes", "updatedAt") SELECT "address", "createdAt", "createdById", "id", "label", "notes", "updatedAt" FROM "properties";
DROP TABLE "properties";
ALTER TABLE "new_properties" RENAME TO "properties";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
