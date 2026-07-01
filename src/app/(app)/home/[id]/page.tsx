import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, Plus, Wrench, Sparkles, Hammer, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/modules/enablement";
import { deleteProperty, deleteHomeItem, addItemDocument } from "@/lib/actions/home";
import { ConfirmForm } from "@/components/ConfirmForm";
import { DocumentUploadForm } from "@/components/DocumentUploadForm";
import { HomeItemDocumentList } from "@/components/HomeItemDocumentList";
import { HOME_ITEM_TYPE_LABELS, formatCurrency, formatDate } from "@/lib/utils";

const ITEM_ICONS: Record<string, LucideIcon> = {
  MAINTENANCE: Wrench,
  IMPROVEMENT: Sparkles,
  REPAIR: Hammer,
  OTHER: Tag,
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModuleEnabled("HOME");

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      createdBy: true,
      items: { include: { documents: { orderBy: { uploadedAt: "desc" } } } },
    },
  });
  if (!property) notFound();

  const items = [...property.items].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.getTime() - a.date.getTime();
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/home" className="text-sm text-foreground/60 hover:text-foreground">
          ← Back to home
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-foreground/60">{property.address || "No address set"}</p>
          <h1 className="text-2xl font-semibold">{property.label}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/home/${property.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Pencil size={16} />
            Edit
          </Link>
          <ConfirmForm
            action={deleteProperty.bind(null, property.id)}
            confirmText="Delete this property and all its items and documents? This cannot be undone."
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
          >
            <Trash2 size={16} />
            Delete
          </ConfirmForm>
        </div>
      </div>

      {property.notes && (
        <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
          <h2 className="mb-2 font-medium">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-foreground/80">{property.notes}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Maintenance &amp; improvements</h2>
          <Link
            href={`/home/${property.id}/items/new`}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Plus size={16} />
            Add item
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-foreground/60">
            No items yet. Add a maintenance, improvement, or repair record to start tracking.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = ITEM_ICONS[item.type] ?? Tag;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-surface p-4 md:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Icon size={20} className="mt-0.5 shrink-0 text-foreground/50" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground/60">
                          {HOME_ITEM_TYPE_LABELS[item.type] ?? item.type}
                        </p>
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                          {item.title}
                          {item.isTaxDeductible && (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-normal text-success">
                              Tax deductible
                            </span>
                          )}
                        </p>
                        {item.provider && (
                          <p className="text-sm text-foreground/70">{item.provider}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/home/${property.id}/items/${item.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <Pencil size={16} />
                        Edit
                      </Link>
                      <ConfirmForm
                        action={deleteHomeItem.bind(null, property.id, item.id)}
                        confirmText={`Delete "${item.title}" and its documents?`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
                      >
                        <Trash2 size={16} />
                        Delete
                      </ConfirmForm>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <Detail label="Date" value={formatDate(item.date)} />
                    <Detail
                      label="Cost"
                      value={item.cost != null ? formatCurrency(item.cost, item.currency) : "—"}
                    />
                  </dl>

                  {item.notes && (
                    <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/80">
                      {item.notes}
                    </p>
                  )}

                  <div className="mt-4 border-t border-border pt-4">
                    <h3 className="mb-2 text-sm font-medium">Documents</h3>
                    <HomeItemDocumentList documents={item.documents} />
                    <div className="mt-3">
                      <DocumentUploadForm action={addItemDocument.bind(null, item.id)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-foreground/40">
        Added by {property.createdBy.name} on {formatDate(property.createdAt)}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-foreground/50">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
