export function parseThresholds(value: string | null | undefined, defaultDays = "30,14,7,1"): number[] {
  const source = value && value.trim() ? value : defaultDays;
  const days = source
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);

  return Array.from(new Set(days)).sort((a, b) => a - b);
}
