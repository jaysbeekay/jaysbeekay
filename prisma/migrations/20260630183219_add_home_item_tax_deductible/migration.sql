-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_home_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "date" DATETIME,
    "cost" REAL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "home_items_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_home_items" ("cost", "createdAt", "currency", "date", "id", "notes", "propertyId", "provider", "title", "type", "updatedAt") SELECT "cost", "createdAt", "currency", "date", "id", "notes", "propertyId", "provider", "title", "type", "updatedAt" FROM "home_items";
DROP TABLE "home_items";
ALTER TABLE "new_home_items" RENAME TO "home_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
