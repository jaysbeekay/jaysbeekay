"use client";

import { useActionState } from "react";
import type { ContractModel } from "@/generated/prisma/models";
import type { ActionState } from "@/lib/actions/contracts";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";
import {
  BILLING_LABELS,
  CATEGORY_LABELS,
  RENEWAL_LABELS,
} from "@/lib/utils";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function ContractForm({
  action,
  contract,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  contract?: ContractModel;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            defaultValue={contract?.title}
            placeholder="e.g. Apartment lease - 12 Main St"
            className={inputClass}
          />
        </Field>

        <Field label="Category" htmlFor="category">
          <select
            id="category"
            name="category"
            required
            defaultValue={contract?.category ?? "OTHER"}
            className={inputClass}
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Provider / Company" htmlFor="provider">
          <input
            id="provider"
            name="provider"
            required
            defaultValue={contract?.provider}
            placeholder="e.g. Allianz, Acme Realty"
            className={inputClass}
          />
        </Field>

        <Field label="Contract / policy number" htmlFor="contractNumber">
          <input
            id="contractNumber"
            name="contractNumber"
            defaultValue={contract?.contractNumber ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="Start date" htmlFor="startDate">
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(contract?.startDate)}
            className={inputClass}
          />
        </Field>

        <Field label="End date" htmlFor="endDate">
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInputValue(contract?.endDate)}
            className={inputClass}
          />
        </Field>

        <Field label="Renewal type" htmlFor="renewalType">
          <select
            id="renewalType"
            name="renewalType"
            defaultValue={contract?.renewalType ?? "MANUAL_RENEWAL"}
            className={inputClass}
          >
            {Object.entries(RENEWAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notice period (days)" htmlFor="noticePeriodDays">
          <input
            id="noticePeriodDays"
            name="noticePeriodDays"
            type="number"
            min={0}
            defaultValue={contract?.noticePeriodDays ?? ""}
            placeholder="e.g. 30"
            className={inputClass}
          />
        </Field>

        <Field label="Cost" htmlFor="cost">
          <input
            id="cost"
            name="cost"
            type="number"
            min={0}
            step="0.01"
            defaultValue={contract?.cost ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="Currency" htmlFor="currency">
          <input
            id="currency"
            name="currency"
            defaultValue={contract?.currency ?? "AUD"}
            maxLength={10}
            className={inputClass}
          />
        </Field>

        <Field label="Billing frequency" htmlFor="billingFrequency">
          <select
            id="billingFrequency"
            name="billingFrequency"
            defaultValue={contract?.billingFrequency ?? ""}
            className={inputClass}
          >
            <option value="">Not set</option>
            {Object.entries(BILLING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        {contract && (
          <Field label="Status" htmlFor="status">
            <select
              id="status"
              name="status"
              defaultValue={contract.status}
              className={inputClass}
            >
              <option value="ACTIVE">Active</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </Field>
        )}
      </div>

      <fieldset className="space-y-4 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground/70">
          Contact details (optional)
        </legend>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Contact name" htmlFor="contactName">
            <input
              id="contactName"
              name="contactName"
              defaultValue={contract?.contactName ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Contact phone" htmlFor="contactPhone">
            <input
              id="contactPhone"
              name="contactPhone"
              defaultValue={contract?.contactPhone ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Contact email" htmlFor="contactEmail">
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={contract?.contactEmail ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <Field label="Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={contract?.notes ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label="Remind me before expiry (days, comma-separated)"
        htmlFor="reminderDaysBefore"
      >
        <input
          id="reminderDaysBefore"
          name="reminderDaysBefore"
          defaultValue={contract?.reminderDaysBefore ?? ""}
          placeholder="30,14,7,1"
          className={inputClass}
        />
      </Field>

      <FormMessage error={state?.error} success={state?.success} />

      <div className="flex justify-end gap-3">
        <SubmitButton>{contract ? "Save changes" : "Add contract"}</SubmitButton>
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
