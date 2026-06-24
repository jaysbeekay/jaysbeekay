import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { encryptBuffer } from "@/lib/crypto";
import { env, isBackupConfigured, isS3BackupConfigured, isSftpBackupConfigured } from "@/lib/env";
import { createSnapshot } from "@/lib/backup/snapshot";
import { pruneS3, uploadToS3 } from "@/lib/backup/s3";
import { pruneSftp, uploadToSftp } from "@/lib/backup/sftp";
import type { BackupDestination } from "@/generated/prisma/enums";

type Destination = {
  name: BackupDestination;
  upload: () => Promise<void>;
  prune: () => Promise<void>;
};

export async function runBackup(): Promise<{ attempted: number; succeeded: number; failed: number }> {
  if (!isBackupConfigured()) {
    return { attempted: 0, succeeded: 0, failed: 0 };
  }

  const snapshot = await createSnapshot();

  try {
    const plain = await readFile(snapshot.path);
    const encrypted = encryptBuffer(plain);
    const fileName = `contracts-${new Date().toISOString().replace(/[:.]/g, "-")}.db.enc`;

    const destinations: Destination[] = [];
    if (isS3BackupConfigured()) {
      destinations.push({
        name: "S3",
        upload: () => uploadToS3(encrypted, fileName),
        prune: () => pruneS3(env.backup.retentionCount),
      });
    }
    if (isSftpBackupConfigured()) {
      destinations.push({
        name: "SFTP",
        upload: () => uploadToSftp(encrypted, fileName),
        prune: () => pruneSftp(env.backup.retentionCount),
      });
    }

    let succeeded = 0;
    let failed = 0;

    for (const destination of destinations) {
      const startedAt = new Date();
      try {
        await destination.upload();
        await destination.prune();
        await prisma.backupLog.create({
          data: {
            destination: destination.name,
            status: "SUCCESS",
            fileName,
            sizeBytes: encrypted.length,
            startedAt,
            finishedAt: new Date(),
          },
        });
        succeeded += 1;
      } catch (error) {
        console.error(`[backup] ${destination.name} backup failed:`, error);
        await prisma.backupLog.create({
          data: {
            destination: destination.name,
            status: "FAILURE",
            fileName,
            message: error instanceof Error ? error.message : String(error),
            startedAt,
            finishedAt: new Date(),
          },
        });
        failed += 1;
      }
    }

    return { attempted: destinations.length, succeeded, failed };
  } finally {
    await snapshot.cleanup();
  }
}
