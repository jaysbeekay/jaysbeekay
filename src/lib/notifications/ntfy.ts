import { env, isNtfyConfigured } from "@/lib/env";

function stripNewlines(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export async function sendNtfyReminder(opts: {
  kind: "contract" | "warranty";
  title: string;
  detail: string;
  daysRemaining: number;
  endDate: Date;
}) {
  if (!isNtfyConfigured()) return;

  const url = `${env.ntfy.url.replace(/\/$/, "")}/${env.ntfy.topic}`;
  const formattedDate = opts.endDate.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const headers: Record<string, string> = {
    Title: stripNewlines(
      `${opts.title} expires in ${opts.daysRemaining} day${
        opts.daysRemaining === 1 ? "" : "s"
      }`,
    ),
    Priority: opts.daysRemaining <= 7 ? "high" : "default",
    Tags: "warning,calendar",
  };
  if (env.ntfy.token) {
    headers.Authorization = `Bearer ${env.ntfy.token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: `${opts.detail ? `${opts.detail} ` : ""}${opts.kind} expires on ${formattedDate}.`,
  });

  if (!response.ok) {
    throw new Error(`ntfy request failed with status ${response.status}`);
  }
}
