import Link from "next/link";
import type { ContractModel } from "@/generated/prisma/models";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import {
  CATEGORY_LABELS,
  BILLING_LABELS,
  daysUntil,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

export function ContractCard({ contract }: { contract: ContractModel }) {
  const days = daysUntil(contract.endDate);
  const cancelled = contract.status === "CANCELLED";

  return (
    <Link
      href={`/contracts/${contract.id}`}
      className="block rounded-xl border border-border bg-surface p-4 transition hover:border-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground/60">
            {CATEGORY_LABELS[contract.category] ?? contract.category}
          </p>
          <p className="truncate font-medium">{contract.title}</p>
          <p className="truncate text-sm text-foreground/70">{contract.provider}</p>
        </div>
        <ExpiryBadge days={days} cancelled={cancelled} />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-foreground/60">
        <span>
          {contract.endDate ? `Ends ${formatDate(contract.endDate)}` : "No end date"}
        </span>
        {contract.cost != null && (
          <span>
            {formatCurrency(contract.cost, contract.currency)}
            {contract.billingFrequency ? ` / ${BILLING_LABELS[contract.billingFrequency]?.toLowerCase()}` : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
