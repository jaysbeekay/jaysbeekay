/*
  Warnings:

  - You are about to drop the column `rentalCurrency` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `rentalLeaseEnd` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `rentalLeaseStart` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `rentalManagementFeePercent` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `rentalTenantName` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `rentalWeeklyRent` on the `properties` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "rental_agreements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "tenantName" TEXT,
    "weeklyRent" REAL NOT NULL,
    "managementFeePercent" REAL,
    "leaseStart" DATETIME,
    "leaseEnd" DATETIME,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rental_agreements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "properties_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_properties" ("address", "createdAt", "createdById", "id", "isRented", "label", "notes", "updatedAt") SELECT "address", "createdAt", "createdById", "id", "isRented", "label", "notes", "updatedAt" FROM "properties";
DROP TABLE "properties";
ALTER TABLE "new_properties" RENAME TO "properties";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
