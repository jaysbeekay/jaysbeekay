import type { Metadata } from "next";
import Link from "next/link";
import { DatabaseBackup, Users, Webhook } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateNotificationPreferences } from "@/lib/actions/auth";
import { isEmailConfigured, isEncryptionConfigured, isNtfyConfigured } from "@/lib/env";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { AiSettingsForm } from "@/components/AiSettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <h2 className="mb-3 font-medium">Profile</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-foreground/50">Name</dt>
            <dd className="text-sm font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">Email</dt>
            <dd className="text-sm font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">Role</dt>
            <dd className="text-sm font-medium">{user.role}</dd>
          </div>
        </dl>
        {user.role === "ADMIN" && (
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/settings/users"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <Users size={16} />
              Manage household members
            </Link>
            <Link
              href="/settings/backups"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <DatabaseBackup size={16} />
              Database backups
            </Link>
            <Link
              href="/settings/webhooks"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <Webhook size={16} />
              Webhooks
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <h2 className="mb-3 font-medium">Notifications</h2>
        <p className="mb-3 text-sm text-foreground/60">
          Expiry reminders are sent by email{isNtfyConfigured() ? " and push (ntfy)" : ""}.{" "}
          {!isEmailConfigured() && !isNtfyConfigured() && (
            <span className="text-amber-600 dark:text-amber-400">
              No notification channel is configured yet — set SMTP or ntfy environment
              variables to enable reminders.
            </span>
          )}
        </p>
        <form action={updateNotificationPreferences} className="flex items-center gap-2">
          <input
            id="emailReminders"
            name="emailReminders"
            type="checkbox"
            defaultChecked={user.emailReminders}
            className="size-4 rounded border-border accent-accent"
          />
          <label htmlFor="emailReminders" className="text-sm">
            Email me about contracts expiring soon
          </label>
          <button
            type="submit"
            className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
          >
            Save
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <h2 className="mb-3 font-medium">AI document extraction</h2>
        {isEncryptionConfigured() ? (
          <>
            <p className="mb-3 text-sm text-foreground/60">
              Bring your own API key to send uploaded documents to a cloud AI provider for
              higher-accuracy field extraction. Documents are sent directly to your selected
              provider using your key — nothing changes about how extracted fields are saved;
              you still review them before submitting the form. Leave this unset to keep using
              the built-in local extraction only.
            </p>
            <AiSettingsForm provider={user.aiProvider} model={user.aiModel} />
          </>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Set ENCRYPTION_KEY on the server to enable bringing your own AI provider key.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <h2 className="mb-3 font-medium">Change password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
