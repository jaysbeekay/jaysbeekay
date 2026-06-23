"use client";

import { useActionState, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Upload } from "lucide-react";
import type { ProductModel } from "@/generated/prisma/models";
import type { ActionState } from "@/lib/actions/products";
import { SubmitButton } from "@/components/SubmitButton";
import { FormMessage } from "@/components/FormMessage";

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

type ExtractedFields = Partial<
  Record<"name" | "manufacturer" | "vendor" | "serialNumber" | "purchaseDate" | "price", string>
>;

export function ProductForm({
  action,
  product,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  product?: ProductModel;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const manufacturerRef = useRef<HTMLInputElement>(null);
  const vendorRef = useRef<HTMLInputElement>(null);
  const serialNumberRef = useRef<HTMLInputElement>(null);
  const purchaseDateRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  function applyExtractedFields(fields: ExtractedFields) {
    if (fields.name && nameRef.current && !nameRef.current.value) {
      nameRef.current.value = fields.name;
    }
    if (fields.manufacturer && manufacturerRef.current) {
      manufacturerRef.current.value = fields.manufacturer;
    }
    if (fields.vendor && vendorRef.current) vendorRef.current.value = fields.vendor;
    if (fields.serialNumber && serialNumberRef.current) {
      serialNumberRef.current.value = fields.serialNumber;
    }
    if (fields.purchaseDate && purchaseDateRef.current) {
      purchaseDateRef.current.value = fields.purchaseDate;
    }
    if (fields.price && priceRef.current) priceRef.current.value = fields.price;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/products/extract", { method: "POST", body });
      if (!res.ok) throw new Error("Extraction failed");

      const { fields } = (await res.json()) as { fields: ExtractedFields };
      if (Object.keys(fields).length === 0) {
        setScanMessage("Couldn't detect any fields from this invoice — fill them in manually.");
      } else {
        applyExtractedFields(fields);
        setScanMessage("Fields populated from the invoice — review before saving.");
      }
    } catch {
      setScanMessage("Couldn't scan this invoice. You can still attach it and fill in fields manually.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {!product && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-dashed border-border p-4">
            <label htmlFor="invoiceFile" className="flex items-center gap-2 text-sm font-medium">
              <Upload size={16} />
              Upload an invoice to auto-fill fields (optional)
            </label>
            <input
              type="file"
              id="invoiceFile"
              name="invoiceFile"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileChange}
              className="text-sm"
            />
            {scanning && <p className="text-sm text-foreground/60">Scanning invoice…</p>}
            {!scanning && scanMessage && (
              <p className="text-sm text-foreground/60">{scanMessage}</p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-dashed border-border p-4">
            <label htmlFor="photoFile" className="flex items-center gap-2 text-sm font-medium">
              <Upload size={16} />
              Upload a photo of the product (optional)
            </label>
            <input
              type="file"
              id="photoFile"
              name="photoFile"
              accept="image/*"
              className="text-sm"
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Product name" htmlFor="name">
          <input
            ref={nameRef}
            id="name"
            name="name"
            required
            defaultValue={product?.name}
            placeholder="e.g. Samsung 65-inch QLED TV"
            className={inputClass}
          />
        </Field>

        <Field label="Manufacturer" htmlFor="manufacturer">
          <input
            ref={manufacturerRef}
            id="manufacturer"
            name="manufacturer"
            defaultValue={product?.manufacturer ?? ""}
            placeholder="e.g. Samsung"
            className={inputClass}
          />
        </Field>

        <Field label="Vendor / retailer" htmlFor="vendor">
          <input
            ref={vendorRef}
            id="vendor"
            name="vendor"
            defaultValue={product?.vendor ?? ""}
            placeholder="e.g. JB Hi-Fi"
            className={inputClass}
          />
        </Field>

        <Field label="Serial number" htmlFor="serialNumber">
          <input
            ref={serialNumberRef}
            id="serialNumber"
            name="serialNumber"
            defaultValue={product?.serialNumber ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="Purchase date" htmlFor="purchaseDate">
          <input
            ref={purchaseDateRef}
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={toDateInputValue(product?.purchaseDate)}
            className={inputClass}
          />
        </Field>

        <Field label="Warranty end date" htmlFor="warrantyEndDate">
          <input
            id="warrantyEndDate"
            name="warrantyEndDate"
            type="date"
            defaultValue={toDateInputValue(product?.warrantyEndDate)}
            className={inputClass}
          />
        </Field>

        <Field label="Price" htmlFor="price">
          <input
            ref={priceRef}
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={product?.price ?? ""}
            className={inputClass}
          />
        </Field>

        <Field label="Currency" htmlFor="currency">
          <input
            id="currency"
            name="currency"
            defaultValue={product?.currency ?? "AUD"}
            maxLength={10}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={product?.notes ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label="Remind me before warranty expiry (days, comma-separated)"
        htmlFor="reminderDaysBefore"
      >
        <input
          id="reminderDaysBefore"
          name="reminderDaysBefore"
          defaultValue={product?.reminderDaysBefore ?? ""}
          placeholder="30,14,7,1"
          className={inputClass}
        />
      </Field>

      <FormMessage error={state?.error} success={state?.success} />

      <div className="flex justify-end gap-3">
        <SubmitButton>{product ? "Save changes" : "Add product"}</SubmitButton>
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
