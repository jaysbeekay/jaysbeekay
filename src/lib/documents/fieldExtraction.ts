import { env, isOllamaConfigured } from "@/lib/env";
import { BILLING_FREQUENCIES } from "@/lib/validation/contract";
import {
  findCompanyLine,
  findCost,
  findEmail,
  findLabeledDate,
  findLabeledValue,
  findPhone,
} from "@/lib/documents/textHeuristics";

export interface ExtractedFields {
  title?: string;
  provider?: string;
  contractNumber?: string;
  startDate?: string;
  endDate?: string;
  cost?: string;
  billingFrequency?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

const FIELD_KEYS = [
  "title",
  "provider",
  "contractNumber",
  "startDate",
  "endDate",
  "cost",
  "billingFrequency",
  "contactName",
  "contactPhone",
  "contactEmail",
] as const;

function findBillingFrequency(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/\bweekly\b/.test(lower)) return "WEEKLY";
  if (/\bmonthly\b/.test(lower)) return "MONTHLY";
  if (/\bquarterly\b/.test(lower)) return "QUARTERLY";
  if (/\b(annual(ly)?|yearly|per annum|p\.a\.)\b/.test(lower)) return "ANNUALLY";
  if (/\bone[\s-]?(off|time)\b/.test(lower)) return "ONE_OFF";
  return undefined;
}

function heuristicExtract(text: string): ExtractedFields {
  return {
    provider: findCompanyLine(text),
    contractNumber: findLabeledValue(
      text,
      /(account|policy|contract|reference|customer|member)\s*(no\.?|number|id)/i,
      /[:#]?\s*([A-Za-z0-9-/]{4,30})\s*$/,
    ),
    startDate: findLabeledDate(
      text,
      /(start date|commencement|effective date|policy start|contract start|term start|cover start)/i,
    ),
    endDate: findLabeledDate(
      text,
      /(end date|expiry|expiration|renewal date|valid until|valid to|policy end|contract end|term end|cover end)/i,
    ),
    cost: findCost(text),
    billingFrequency: findBillingFrequency(text),
    contactPhone: findPhone(text),
    contactEmail: findEmail(text),
  };
}

function countFound(fields: ExtractedFields): number {
  return Object.values(fields).filter((v) => v != null && v !== "").length;
}

async function llmExtract(text: string): Promise<ExtractedFields | null> {
  const prompt =
    "Extract contract details from the following document text as a single JSON object " +
    "with these optional keys: title, provider, contractNumber, startDate (YYYY-MM-DD), " +
    `endDate (YYYY-MM-DD), cost (number only, no currency symbol), billingFrequency (one of ` +
    `${BILLING_FREQUENCIES.join(", ")}), contactName, contactPhone, contactEmail. Omit keys ` +
    "you cannot determine. Respond with JSON only, no other text.\n\n" +
    `Document text:\n${text.slice(0, 6000)}`;

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

    const fields: ExtractedFields = {};
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

export async function extractContractFields(
  text: string,
): Promise<{ fields: ExtractedFields; source: "heuristic" | "llm" | "none" }> {
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
