"use client";

export function ConfirmForm({
  action,
  confirmText,
  children,
  className,
}: {
  action: () => Promise<unknown>;
  confirmText: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={async () => {
        await action();
      }}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
