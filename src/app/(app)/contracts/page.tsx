import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ContractCard } from "@/components/ContractCard";
import { CATEGORY_LABELS } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  const { q, category, status } = await searchParams;

  const where: Prisma.ContractWhereInput = {};
  if (category) where.category = category as Prisma.ContractWhereInput["category"];
  if (status) where.status = status as Prisma.ContractWhereInput["status"];
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { provider: { contains: q } },
      { contractNumber: { contains: q } },
    ];
  }

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contracts</h1>
        <Link
          href="/contracts/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          <Plus size={16} />
          Add contract
        </Link>
      </div>

      <form className="flex flex-col gap-3 md:flex-row" method="GET">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by title, provider, or number…"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
        >
          Filter
        </button>
      </form>

      {contracts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-foreground/60">
          No contracts found. Try adjusting your filters, or add a new contract.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      )}
    </div>
  );
}
