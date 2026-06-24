"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { isEncryptionConfigured } from "@/lib/env";
import { aiSettingsSchema } from "@/lib/validation/ai";

export type ActionState = { error?: string; success?: string } | null;

export async function saveAiSettings(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  if (!isEncryptionConfigured()) {
    return { error: "Set ENCRYPTION_KEY on the server before configuring an API key." };
  }

  const parsed = aiSettingsSchema.safeParse({
    provider: formData.get("provider"),
    apiKey: formData.get("apiKey"),
    model: formData.get("model") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      aiProvider: parsed.data.provider,
      aiApiKeyEncrypted: encryptSecret(parsed.data.apiKey),
      aiModel: parsed.data.model ?? null,
    },
  });

  revalidatePath("/settings");
  return { success: "API key saved." };
}

export async function removeAiSettings(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { aiProvider: null, aiApiKeyEncrypted: null, aiModel: null },
  });

  revalidatePath("/settings");
  return { success: "API key removed." };
}
