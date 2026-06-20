import { cn, expiryLabel } from "@/lib/utils";

export function ExpiryBadge({
  days,
  cancelled,
}: {
  days: number | null;
  cancelled?: boolean;
}) {
  const tone = cancelled
    ? "bg-slate-500/10 text-slate-500 dark:text-slate-400"
    : days == null
      ? "bg-slate-500/10 text-slate-500 dark:text-slate-400"
      : days < 0
        ? "bg-red-500/10 text-red-600 dark:text-red-400"
        : days <= 7
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : days <= 30
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tone)}>
      {cancelled ? "Cancelled" : expiryLabel(days)}
    </span>
  );
}
