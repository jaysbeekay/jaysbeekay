import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ContractCard } from "@/components/ContractCard";
import { ProductCard } from "@/components/ProductCard";
import { StatCard } from "@/components/StatCard";
import { daysUntil, monthlyEquivalent } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const contracts = await prisma.contract.findMany({
    orderBy: { endDate: "asc" },
  });
  const products = await prisma.product.findMany({
    orderBy: { warrantyEndDate: "asc" },
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

  const productsWithDays = products.map((p) => ({
    product: p,
    days: daysUntil(p.warrantyEndDate),
  }));

  const warrantiesExpiringSoon = productsWithDays
    .filter((p) => p.days != null && p.days >= 0 && p.days <= 30)
    .sort((a, b) => (a.days as number) - (b.days as number));

  const warrantiesExpired = productsWithDays.filter((p) => p.days != null && p.days < 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-foreground/60">
            An overview of all your contracts and product warranties.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/contracts/new"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Plus size={16} />
            Add contract
          </Link>
          <Link
            href="/products/new"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Plus size={16} />
            Add product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active contracts" value={String(active.length)} />
        <StatCard
          label="Contracts expiring in 30 days"
          value={String(expiringSoon.length)}
          tone={expiringSoon.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Contracts expired"
          value={String(expired.length)}
          tone={expired.length > 0 ? "danger" : "default"}
        />
        <StatCard label="Est. monthly spend" value={`$${monthlySpend.toFixed(0)}`} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Products tracked" value={String(products.length)} />
        <StatCard
          label="Warranties expiring in 30 days"
          value={String(warrantiesExpiringSoon.length)}
          tone={warrantiesExpiringSoon.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Warranties expired"
          value={String(warrantiesExpired.length)}
          tone={warrantiesExpired.length > 0 ? "danger" : "default"}
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Contracts expiring soon</h2>
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
          <h2 className="font-medium">Contracts expired</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {expired.map(({ contract }) => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">Warranties expiring soon</h2>
        {warrantiesExpiringSoon.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-foreground/60">
            Nothing expiring in the next 30 days.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {warrantiesExpiringSoon.map(({ product }) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {warrantiesExpired.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium">Warranties expired</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {warrantiesExpired.map(({ product }) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
