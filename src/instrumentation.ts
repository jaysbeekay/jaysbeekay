export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const globalForCron = globalThis as unknown as { __reminderCronStarted?: boolean };
  if (globalForCron.__reminderCronStarted) return;
  globalForCron.__reminderCronStarted = true;

  const cron = await import("node-cron");
  const { env } = await import("@/lib/env");
  const { runExpirationCheck } = await import("@/lib/notifications/scheduler");

  cron.schedule(env.reminderCron, () => {
    runExpirationCheck().catch((error) => {
      console.error("[notifications] scheduled expiration check failed:", error);
    });
  });

  console.log(`[notifications] reminder scheduler started (cron: "${env.reminderCron}")`);
}
