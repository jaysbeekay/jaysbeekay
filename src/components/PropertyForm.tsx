"use client";

import { useActionState } from "react";
import type { PropertyModel } from "@/generated/prisma/models";
import type { ActionState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";

export function PropertyForm({
  action,
  property,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  property?: PropertyModel;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Label" htmlFor="label">
          <input
            id="label"
            name="label"
            required
            defaultValue={state?.values?.label ?? property?.label}
            placeholder="e.g. Main residence"
            className={inputClass}
          />
        </Field>

        <Field label="Address" htmlFor="address">
          <input
            id="address"
            name="address"
            defaultValue={state?.values?.address ?? property?.address ?? ""}
            placeholder="e.g. 35C Clarence Street"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={state?.values?.notes ?? property?.notes ?? ""}
          className={inputClass}
        />
      </Field>

      <FormMessage error={state?.error} success={state?.success} />

      <div className="flex justify-end gap-3">
        <SubmitButton>{property ? "Save changes" : "Add property"}</SubmitButton>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
