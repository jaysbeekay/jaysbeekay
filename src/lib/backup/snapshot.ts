import { randomBytes } from "crypto";
import { rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { prisma } from "@/lib/prisma";

// SQLite's VACUUM INTO writes a consistent point-in-time copy of the live
// database to a new file without locking out readers/writers, so the app
// keeps running normally while a backup is taken. The target path must not
// already exist, hence the random suffix.
export async function createSnapshot(): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const snapshotPath = path.join(tmpdir(), `contracts-backup-${randomBytes(8).toString("hex")}.db`);

  await prisma.$executeRawUnsafe("VACUUM INTO ?", snapshotPath);

  return {
    path: snapshotPath,
    cleanup: () => rm(snapshotPath, { force: true }),
  };
}
