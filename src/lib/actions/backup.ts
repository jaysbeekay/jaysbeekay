"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { runBackup } from "@/lib/backup/scheduler";
import type { ActionState } from "@/lib/actions/auth";

// Signature matches useActionState's (prevState, formData) contract even
// though this action takes no form input.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function triggerBackup(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return { error: "Only admins can trigger backups." };
  }

  const result = await runBackup();
  revalidatePath("/settings/backups");

  if (result.attempted === 0) {
    return { error: "No backup destination is configured." };
  }
  if (result.failed > 0 && result.succeeded === 0) {
    return { error: "Backup failed on all destinations. Check server logs for details." };
  }
  if (result.failed > 0) {
    return { success: `Backup completed, but ${result.failed} destination(s) failed.` };
  }
  return { success: `Backup completed successfully (${result.succeeded} destination(s)).` };
}
