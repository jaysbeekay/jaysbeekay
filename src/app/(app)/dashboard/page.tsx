import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ContractCard } from "@/components/ContractCard";
import { StatCard } from "@/components/StatCard";
import { daysUntil, monthlyEquivalent } from "@/lib/utils";

export default async function DashboardPage() {
  const contracts = await prisma.contract.findMany({
    orderBy: { endDate: "asc" },
  });

  const active = contracts.filter((c) => c.status === "ACTIVE");
  const withDays = active.map((c) => ({ contract: c, days: daysUntil(c.endDate) }));

  const expiringSoon = withDays
    .filter((c) => c.days != null && c.days >= 0 && c.days <= 30)
    .sort((a, b) => (a.days as number) - (b.days as number));

  const expired = withDays.filter((c) => c.days != null && c.days < 0);

  const monthlySpend = active.reduce(
    (sum, c) => sum + monthlyEquivalent(c.cost, c.billingFrequency),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-foreground/60">An overview of all your contracts.</p>
        </div>
        <Link
          href="/contracts/new"
          className="hidden items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 md:flex"
        >
          <Plus size={16} />
          Add contract
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active contracts" value={String(active.length)} />
        <StatCard
          label="Expiring in 30 days"
          value={String(expiringSoon.length)}
          tone={expiringSoon.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Expired"
          value={String(expired.length)}
          tone={expired.length > 0 ? "danger" : "default"}
        />
        <StatCard label="Est. monthly spend" value={`$${monthlySpend.toFixed(0)}`} />
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Expiring soon</h2>
        {expiringSoon.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-foreground/60">
            Nothing expiring in the next 30 days.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {expiringSoon.map(({ contract }) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
          </div>
        )}
      </section>

      {expired.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium">Expired</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {expired.map(({ contract }) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
