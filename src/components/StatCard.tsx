import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "text-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", toneClasses[tone])}>{value}</p>
    </div>
  );
}
