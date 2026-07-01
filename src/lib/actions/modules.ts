"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ModuleKey } from "@/lib/modules/registry";
import type { ActionState } from "@/lib/actions/auth";

export async function toggleModule(key: ModuleKey, enabled: boolean): Promise<ActionState> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return { error: "Only admins can change modules." };
  }

  await prisma.moduleEnablement.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  });

  revalidatePath("/settings/modules");
  revalidatePath("/", "layout");
  return { success: enabled ? "Module enabled." : "Module disabled." };
}
