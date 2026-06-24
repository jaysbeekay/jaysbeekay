import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  env,
  isBackupConfigured,
  isEncryptionConfigured,
  isS3BackupConfigured,
  isSftpBackupConfigured,
} from "@/lib/env";
import { BackupNowForm } from "@/components/BackupNowForm";
import { formatDate, humanFileSize } from "@/lib/utils";

export default async function BackupsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    redirect("/settings");
  }

  const logs = await prisma.backupLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Database backups</h1>

      <section className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <h2 className="mb-3 font-medium">Configuration</h2>
        <ul className="space-y-1 text-sm">
          <li>
            Encryption: {isEncryptionConfigured() ? "configured" : "not configured"}
          </li>
          <li>S3-compatible storage: {isS3BackupConfigured() ? "configured" : "not configured"}</li>
          <li>SFTP: {isSftpBackupConfigured() ? "configured" : "not configured"}</li>
          <li>Schedule: {env.backup.cron}</li>
          <li>Retention: last {env.backup.retentionCount} backups per destination</li>
        </ul>

        {!isBackupConfigured() && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            {isEncryptionConfigured()
              ? "Set BACKUP_S3_* or BACKUP_SFTP_* environment variables to enable offsite backups."
              : "Set ENCRYPTION_KEY, plus BACKUP_S3_* or BACKUP_SFTP_* environment variables, to enable offsite backups. Backups are never sent unencrypted."}
          </p>
        )}

        {isBackupConfigured() && (
          <div className="mt-4">
            <BackupNowForm />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <h2 className="mb-3 font-medium">Recent runs</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-foreground/60">No backups have run yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {log.destination}{" "}
                    <span
                      className={
                        log.status === "SUCCESS"
                          ? "text-success"
                          : "text-danger"
                      }
                    >
                      · {log.status}
                    </span>
                  </p>
                  <p className="text-xs text-foreground/50">
                    {formatDate(log.startedAt)}
                    {log.sizeBytes ? ` · ${humanFileSize(log.sizeBytes)}` : ""}
                    {log.message ? ` · ${log.message}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
