import { cn } from "@/lib/utils";

export function FormMessage({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;

  return (
    <p
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        error
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      )}
    >
      {error ?? success}
    </p>
  );
}
