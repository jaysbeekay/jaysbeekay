import { env, isOllamaConfigured } from "@/lib/env";
import {
  findCompanyLine,
  findCost,
  findLabeledDate,
  findLabeledValue,
} from "@/lib/documents/textHeuristics";

export interface ExtractedInvoiceFields {
  name?: string;
  manufacturer?: string;
  vendor?: string;
  serialNumber?: string;
  purchaseDate?: string;
  price?: string;
}

const FIELD_KEYS = [
  "name",
  "manufacturer",
  "vendor",
  "serialNumber",
  "purchaseDate",
  "price",
] as const;

function findProductName(text: string): string | undefined {
  return findLabeledValue(
    text,
    /(product|item)\s*(name|description)?\s*[:#]/i,
    /[:#]\s*(.{3,100})\s*$/,
  );
}

function findManufacturer(text: string): string | undefined {
  return findLabeledValue(
    text,
    /(manufacturer|brand|made by)/i,
    /[:#]?\s*([A-Za-z0-9&'.\- ]{2,60})\s*$/,
  );
}

function findSerialNumber(text: string): string | undefined {
  return findLabeledValue(
    text,
    /(serial|s\/n|imei|model\s*(no\.?|number))/i,
    /[:#]?\s*([A-Za-z0-9-/]{4,40})\s*$/,
  );
}

function heuristicExtract(text: string): ExtractedInvoiceFields {
  return {
    vendor: findCompanyLine(text),
    manufacturer: findManufacturer(text),
    name: findProductName(text),
    serialNumber: findSerialNumber(text),
    purchaseDate: findLabeledDate(
      text,
      /(invoice date|purchase date|date of purchase|order date|tax invoice|receipt date)/i,
    ),
    price: findCost(text),
  };
}

function countFound(fields: ExtractedInvoiceFields): number {
  return Object.values(fields).filter((v) => v != null && v !== "").length;
}

async function llmExtract(text: string): Promise<ExtractedInvoiceFields | null> {
  const prompt =
    "Extract product purchase details from the following invoice or receipt text as a " +
    "single JSON object with these optional keys: name (product name), manufacturer (brand), " +
    "vendor (retailer/seller), serialNumber, purchaseDate (YYYY-MM-DD), price (number only, " +
    "no currency symbol). Omit keys you cannot determine. Respond with JSON only, no other " +
    `text.\n\nDocument text:\n${text.slice(0, 6000)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${env.ollama.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.ollama.model, prompt, format: "json", stream: false }),
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { response?: string };
    if (!data.response) return null;
    const parsed = JSON.parse(data.response);
    if (typeof parsed !== "object" || parsed === null) return null;

    const fields: ExtractedInvoiceFields = {};
    for (const key of FIELD_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) fields[key] = value.trim();
      else if (typeof value === "number") fields[key] = String(value);
    }
    return fields;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Below this many matched fields, the regex pass is considered unreliable
// (e.g. an unusual layout or noisy OCR) and worth retrying with an LLM.
const LOW_CONFIDENCE_THRESHOLD = 2;

export async function extractInvoiceFields(
  text: string,
): Promise<{ fields: ExtractedInvoiceFields; source: "heuristic" | "llm" | "none" }> {
  if (!text.trim()) return { fields: {}, source: "none" };

  const heuristic = heuristicExtract(text);
  if (countFound(heuristic) >= LOW_CONFIDENCE_THRESHOLD || !isOllamaConfigured()) {
    return { fields: heuristic, source: "heuristic" };
  }

  const llm = await llmExtract(text);
  if (!llm || countFound(llm) === 0) {
    return { fields: heuristic, source: "heuristic" };
  }

  return { fields: { ...heuristic, ...llm }, source: "llm" };
}
