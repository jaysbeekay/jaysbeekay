import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import type { Prisma } from "@/generated/prisma/client";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { manufacturer: { contains: q } },
      { vendor: { contains: q } },
      { serialNumber: { contains: q } },
      { barcode: { contains: q } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ warrantyEndDate: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link
          href="/products/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          <Plus size={16} />
          Add product
        </Link>
      </div>

      <form className="flex flex-col gap-3 md:flex-row" method="GET">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, manufacturer, vendor, serial number, or barcode…"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
        >
          Filter
        </button>
      </form>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-foreground/60">
          {q
            ? "No products match your search."
            : "No products yet. Add your first product to get started."}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
