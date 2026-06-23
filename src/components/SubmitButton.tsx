"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "danger" | "secondary";
}) {
  const { pending } = useFormStatus();

  const variants = {
    primary: "bg-accent text-accent-foreground hover:opacity-90",
    danger: "bg-red-600 text-white hover:bg-red-700",
    secondary: "bg-transparent border border-border hover:bg-black/5 dark:hover:bg-white/5",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
