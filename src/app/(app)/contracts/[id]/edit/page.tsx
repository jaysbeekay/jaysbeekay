import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateContract } from "@/lib/actions/contracts";
import { ContractForm } from "@/components/ContractForm";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) notFound();

  const boundAction = updateContract.bind(null, contract.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit contract</h1>
        <p className="text-sm text-foreground/60">{contract.title}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <ContractForm action={boundAction} contract={contract} />
      </div>
    </div>
  );
}
