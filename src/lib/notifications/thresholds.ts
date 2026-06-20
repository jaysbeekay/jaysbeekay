import { env } from "@/lib/env";

export function parseThresholds(value: string | null | undefined): number[] {
  const source = value && value.trim() ? value : env.reminderDefaultDays;
  const days = source
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);

  return Array.from(new Set(days)).sort((a, b) => a - b);
}
