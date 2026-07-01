export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const globalForCron = globalThis as unknown as {
    __reminderCronStarted?: boolean;
    __backupCronStarted?: boolean;
  };

  const cron = await import("node-cron");
  const { getReminderConfig, isBackupConfigured, getBackupScheduleConfig } = await import(
    "@/lib/appSettings"
  );

  if (!globalForCron.__reminderCronStarted) {
    globalForCron.__reminderCronStarted = true;

    const { runExpirationCheck } = await import("@/lib/notifications/scheduler");
    const { cron: reminderCron } = await getReminderConfig();
    cron.schedule(reminderCron, () => {
      runExpirationCheck().catch((error) => {
        console.error("[notifications] scheduled expiration check failed:", error);
      });
    });

    console.log(`[notifications] reminder scheduler started (cron: "${reminderCron}")`);
  }

  if (!globalForCron.__backupCronStarted && (await isBackupConfigured())) {
    globalForCron.__backupCronStarted = true;

    const { runBackup } = await import("@/lib/backup/scheduler");
    const { cron: backupCron } = await getBackupScheduleConfig();
    cron.schedule(backupCron, () => {
      runBackup().catch((error) => {
        console.error("[backup] scheduled backup failed:", error);
      });
    });

    console.log(`[backup] scheduler started (cron: "${backupCron}")`);
  }
}
