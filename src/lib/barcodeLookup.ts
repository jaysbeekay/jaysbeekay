import { env } from "@/lib/env";

export interface BarcodeProductInfo {
  name?: string;
  manufacturer?: string;
}

interface UpcItemDbResponse {
  code: string;
  items?: {
    title?: string;
    brand?: string;
  }[];
}

const TRIAL_ENDPOINT = "https://api.upcitemdb.com/prod/trial/lookup";
const PROD_ENDPOINT = "https://api.upcitemdb.com/prod/v1/lookup";

export function isValidBarcode(code: string): boolean {
  return /^\d{6,14}$/.test(code);
}

// Looks up a scanned UPC/EAN barcode against UPCitemdb so adding a new
// product can be pre-filled from the barcode alone. Uses the free,
// keyless trial endpoint (rate-limited per IP) unless BARCODE_LOOKUP_API_KEY
// is set, in which case the paid endpoint is used instead.
export async function lookupBarcode(code: string): Promise<BarcodeProductInfo | null> {
  const endpoint = env.barcodeLookup.apiKey ? PROD_ENDPOINT : TRIAL_ENDPOINT;
  const url = `${endpoint}?upc=${encodeURIComponent(code)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: env.barcodeLookup.apiKey
        ? {
            user_key: env.barcodeLookup.apiKey,
            key_type: "3scale",
          }
        : undefined,
    });
    if (!res.ok) return null;

    const data = (await res.json()) as UpcItemDbResponse;
    const item = data.items?.[0];
    if (!item) return null;

    const info: BarcodeProductInfo = {};
    if (item.title) info.name = item.title;
    if (item.brand) info.manufacturer = item.brand;
    return Object.keys(info).length > 0 ? info : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
