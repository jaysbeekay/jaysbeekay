import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/modules/enablement";
import { PropertyCard } from "@/components/PropertyCard";
import { financialYearLabel, formatCurrency, sumByYear } from "@/lib/utils";

export default async function HomePage() {
  await requireModuleEnabled("HOME");

  const properties = await prisma.property.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  const taxDeductibleItems = await prisma.homeItem.findMany({
    where: { isTaxDeductible: true },
    select: { cost: true, date: true, currency: true },
  });
  const byFinancialYear = sumByYear(taxDeductibleItems, financialYearLabel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Home</h1>
        <Link
          href="/home/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          <Plus size={16} />
          Add property
        </Link>
      </div>

      {byFinancialYear.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
          <h2 className="mb-3 font-medium">Tax deductible spend by financial year</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {byFinancialYear.map(({ label, amount, currency }) => (
              <div key={`${label}|${currency}`}>
                <dt className="text-xs text-foreground/50">{label}</dt>
                <dd className="text-sm font-medium">{formatCurrency(amount, currency)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {properties.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-foreground/60">
          No properties yet. Add your first property to start tracking maintenance and improvements.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
