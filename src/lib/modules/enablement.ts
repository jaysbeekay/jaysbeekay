import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MODULE_KEYS, type ModuleKey } from "@/lib/modules/registry";

export async function getEnabledModuleKeys(): Promise<Set<ModuleKey>> {
  const rows = await prisma.moduleEnablement.findMany({
    where: { enabled: true },
    select: { key: true },
  });
  return new Set(rows.map((row) => row.key as ModuleKey));
}

export async function isModuleEnabled(key: ModuleKey): Promise<boolean> {
  const row = await prisma.moduleEnablement.findUnique({ where: { key } });
  return row?.enabled ?? false;
}

export async function requireModuleEnabled(key: ModuleKey) {
  if (!(await isModuleEnabled(key))) {
    redirect("/dashboard");
  }
}

export function isKnownModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(value);
}
