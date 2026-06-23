import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={className ?? "flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"}
      >
        <LogOut size={16} />
        Sign out
      </button>
    </form>
  );
}
