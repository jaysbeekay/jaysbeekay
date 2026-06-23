import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "@/lib/env";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

// Header values must never contain raw newlines, regardless of nodemailer's
// own escaping, to defend against header/CRLF injection from contract titles.
function stripNewlines(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export async function sendReminderEmail(opts: {
  to: string;
  kind: "contract" | "warranty";
  title: string;
  detail: string;
  daysRemaining: number;
  endDate: Date;
}) {
  if (!isEmailConfigured()) return;

  const subject = stripNewlines(
    `Reminder: "${opts.title}" ${opts.kind} expires in ${opts.daysRemaining} day${
      opts.daysRemaining === 1 ? "" : "s"
    }`,
  );

  const formattedDate = opts.endDate.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await getTransporter().sendMail({
    from: env.smtp.from,
    to: opts.to,
    subject,
    text: `Your ${opts.kind} "${opts.title}" (${opts.detail}) expires on ${formattedDate} (${opts.daysRemaining} day(s) from now).\n\nLog in to your contracts app to review it.`,
    html: `<p>Your ${opts.kind} <strong>${escapeHtml(opts.title)}</strong> (${escapeHtml(
      opts.detail,
    )}) expires on <strong>${formattedDate}</strong> (${opts.daysRemaining} day(s) from now).</p><p>Log in to your contracts app to review it.</p>`,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
