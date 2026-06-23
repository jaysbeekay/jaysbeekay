import { env, isOllamaConfigured } from "@/lib/env";
import { BILLING_FREQUENCIES } from "@/lib/validation/contract";

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

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function toIsoDate(day: string, month: string, year: string): string | undefined {
  const y = year.length === 2 ? `20${year}` : year;
  const d = Number(day);
  const m = Number(month);
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return Number.isNaN(new Date(iso).getTime()) ? undefined : iso;
}

// Numeric dates are assumed day/month/year (en-AU convention) when ambiguous.
function matchDate(text: string): string | undefined {
  const numeric = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (numeric) {
    const iso = toIsoDate(numeric[1], numeric[2], numeric[3]);
    if (iso) return iso;
  }
  const iso8601 = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso8601) {
    const iso = toIsoDate(iso8601[3], iso8601[2], iso8601[1]);
    if (iso) return iso;
  }
  const monthName = text.match(
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\b/i,
  );
  if (monthName) {
    const month = MONTHS[monthName[2].toLowerCase()];
    const iso = toIsoDate(monthName[1], month, monthName[3]);
    if (iso) return iso;
  }
  return undefined;
}

function findLabeledDate(text: string, labels: RegExp): string | undefined {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!labels.test(lines[i])) continue;
    const window = lines.slice(i, i + 2).join(" ");
    const iso = matchDate(window);
    if (iso) return iso;
  }
  return undefined;
}

function findLabeledValue(
  text: string,
  labels: RegExp,
  valuePattern: RegExp,
): string | undefined {
  for (const line of text.split(/\r?\n/)) {
    if (!labels.test(line)) continue;
    const match = line.match(valuePattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

function findCost(text: string): string | undefined {
  const priority = /(total|amount due|premium|monthly fee|amount payable|payment|fee)/i;
  let fallback: string | undefined;
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/(?:AUD|USD|NZD|GBP|EUR|\$)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (!match) continue;
    const value = match[1].replace(/,/g, "");
    if (priority.test(line)) return value;
    fallback ??= value;
  }
  return fallback;
}

function findBillingFrequency(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/\bweekly\b/.test(lower)) return "WEEKLY";
  if (/\bmonthly\b/.test(lower)) return "MONTHLY";
  if (/\bquarterly\b/.test(lower)) return "QUARTERLY";
  if (/\b(annual(ly)?|yearly|per annum|p\.a\.)\b/.test(lower)) return "ANNUALLY";
  if (/\bone[\s-]?(off|time)\b/.test(lower)) return "ONE_OFF";
  return undefined;
}

function findProvider(text: string): string | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1 && line.length < 80);
  const companyLine = lines.find((line) =>
    /(pty ltd|ltd\.?|inc\.?|llc|limited|insurance|telecom|energy|utilities)/i.test(line),
  );
  return (companyLine ?? lines[0])?.slice(0, 200);
}

function findEmail(text: string): string | undefined {
  return text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
}

// Requires at least one separator (space/dash/dot/parenthesis) so bare digit
// runs — account numbers, policy numbers — aren't mistaken for phone numbers.
function findPhone(text: string): string | undefined {
  const pattern = /(\+?\d[\d\s().-]{6,}\d)/;
  const hasSeparator = (value: string) => /[\s().-]/.test(value);

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!/(phone|tel\.?|mobile|fax|contact)/i.test(line)) continue;
    const match = line.match(pattern);
    if (match && hasSeparator(match[1])) return match[1].trim();
  }
  for (const line of lines) {
    const match = line.match(pattern);
    if (match && hasSeparator(match[1])) return match[1].trim();
  }
  return undefined;
}

function heuristicExtract(text: string): ExtractedFields {
  return {
    provider: findProvider(text),
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
