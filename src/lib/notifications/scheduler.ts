import { prisma } from "@/lib/prisma";
import { isEmailConfigured, isNtfyConfigured } from "@/lib/env";
import { sendReminderEmail } from "@/lib/notifications/email";
import { sendNtfyReminder } from "@/lib/notifications/ntfy";
import { parseThresholds } from "@/lib/notifications/thresholds";
import type { NotificationChannel } from "@/generated/prisma/enums";

function daysRemaining(endDate: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfEnd = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const startOfNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfEnd - startOfNow) / msPerDay);
}

export async function runExpirationCheck(now: Date = new Date()) {
  const emailEnabled = isEmailConfigured();
  const ntfyEnabled = isNtfyConfigured();
  if (!emailEnabled && !ntfyEnabled) {
    return { checked: 0, sent: 0 };
  }

  const contracts = await prisma.contract.findMany({
    where: { status: "ACTIVE", endDate: { not: null } },
    include: { notifications: true },
  });

  const recipientEmails = emailEnabled
    ? (
        await prisma.user.findMany({
          where: { emailReminders: true },
          select: { email: true },
        })
      ).map((u) => u.email)
    : [];

  let sentCount = 0;

  for (const contract of contracts) {
    if (!contract.endDate) continue;
    const remaining = daysRemaining(contract.endDate, now);
    if (remaining < 0) continue;

    const thresholds = parseThresholds(contract.reminderDaysBefore);
    const dueThresholds = thresholds.filter((t) => remaining <= t);
    if (dueThresholds.length === 0) continue;

    const channels: NotificationChannel[] = [
      ...(emailEnabled && recipientEmails.length > 0 ? (["EMAIL"] as const) : []),
      ...(ntfyEnabled ? (["NTFY"] as const) : []),
    ];

    for (const channel of channels) {
      const loggedThresholds = new Set(
        contract.notifications
          .filter((n) => n.channel === channel)
          .map((n) => n.thresholdDays),
      );
      const unlogged = dueThresholds.filter((t) => !loggedThresholds.has(t));
      if (unlogged.length === 0) continue;

      const threshold = Math.min(...unlogged);

      try {
        if (channel === "EMAIL") {
          await Promise.all(
            recipientEmails.map((to) =>
              sendReminderEmail({
                to,
                contractTitle: contract.title,
                provider: contract.provider,
                daysRemaining: remaining,
                endDate: contract.endDate as Date,
              }),
            ),
          );
        } else {
          await sendNtfyReminder({
            contractTitle: contract.title,
            provider: contract.provider,
            daysRemaining: remaining,
            endDate: contract.endDate,
          });
        }

        await prisma.notificationLog.create({
          data: { contractId: contract.id, channel, thresholdDays: threshold },
        });
        sentCount += 1;
      } catch (error) {
        console.error(
          `[notifications] failed to send ${channel} reminder for contract ${contract.id}:`,
          error,
        );
      }
    }
  }

  return { checked: contracts.length, sent: sentCount };
}
