export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const globalForCron = globalThis as unknown as {
    __reminderCronStarted?: boolean;
    __backupCronStarted?: boolean;
  };

  const cron = await import("node-cron");
  const { env, isBackupConfigured } = await import("@/lib/env");

  if (!globalForCron.__reminderCronStarted) {
    globalForCron.__reminderCronStarted = true;

    const { runExpirationCheck } = await import("@/lib/notifications/scheduler");
    cron.schedule(env.reminderCron, () => {
      runExpirationCheck().catch((error) => {
        console.error("[notifications] scheduled expiration check failed:", error);
      });
    });

    console.log(`[notifications] reminder scheduler started (cron: "${env.reminderCron}")`);
  }

  if (!globalForCron.__backupCronStarted && isBackupConfigured()) {
    globalForCron.__backupCronStarted = true;

    const { runBackup } = await import("@/lib/backup/scheduler");
    cron.schedule(env.backup.cron, () => {
      runBackup().catch((error) => {
        console.error("[backup] scheduled backup failed:", error);
      });
    });

    console.log(`[backup] scheduler started (cron: "${env.backup.cron}")`);
  }
}
